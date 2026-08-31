//! Local stand-in for Telegraph's Stage-2 promotion check.
//!
//! Loads two scoring modules the same way the node does — write the three strings
//! into the module's own memory via its exported `alloc`, then call `rank_answer` —
//! and reports the exact breakdown fields the node records on a registration:
//! candidate_margin, champion_margin, candidate_wins, champion_wins,
//! comparable_cases, worst_self_match, score_stddev.
//!
//! Usage: bench <champion.wasm> <candidate.wasm> [benchmark.json]

use std::env;
use std::fs;
use wasmi::{Engine, Extern, Instance, Linker, Memory, Module, Store, TypedFunc};

struct Scorer {
    store: Store<()>,
    memory: Memory,
    alloc: TypedFunc<i32, i32>,
    rank: TypedFunc<(i32, i32, i32, i32, i32, i32), f32>,
}

impl Scorer {
    fn load(path: &str) -> Result<Self, String> {
        let bytes = fs::read(path).map_err(|e| format!("read {path}: {e}"))?;
        let engine = Engine::default();
        let module = Module::new(&engine, &bytes[..]).map_err(|e| format!("parse {path}: {e}"))?;

        // A valid Telegraph module has no imports at all; refuse anything that does,
        // because that is exactly what fails instantiation on the node (WASI builds).
        let imports: Vec<_> = module.imports().collect();
        if !imports.is_empty() {
            let names: Vec<String> = imports
                .iter()
                .map(|i| format!("{}::{}", i.module(), i.name()))
                .collect();
            return Err(format!(
                "{path} has {} import(s): {} — not a valid Telegraph module \
                 (did you build wasm32-wasip1 instead of wasm32-unknown-unknown?)",
                names.len(),
                names.join(", ")
            ));
        }

        let mut store = Store::new(&engine, ());
        let linker = Linker::new(&engine);
        let instance: Instance = linker
            .instantiate(&mut store, &module)
            .map_err(|e| format!("instantiate {path}: {e}"))?
            .start(&mut store)
            .map_err(|e| format!("start {path}: {e}"))?;

        let memory = match instance.get_export(&store, "memory") {
            Some(Extern::Memory(m)) => m,
            _ => return Err(format!("{path}: no exported `memory`")),
        };
        let alloc = instance
            .get_typed_func::<i32, i32>(&store, "alloc")
            .map_err(|_| format!("{path}: missing export `alloc`"))?;
        // dealloc must exist even though this harness never needs to call it —
        // the node checks for it structurally.
        instance
            .get_typed_func::<(i32, i32), ()>(&store, "dealloc")
            .map_err(|_| format!("{path}: missing export `dealloc`"))?;
        let rank = instance
            .get_typed_func::<(i32, i32, i32, i32, i32, i32), f32>(&store, "rank_answer")
            .map_err(|_| format!("{path}: missing export `rank_answer` with the six i32 params"))?;

        Ok(Scorer { store, memory, alloc, rank })
    }

    fn write(&mut self, s: &str) -> Result<(i32, i32), String> {
        let bytes = s.as_bytes();
        let len = bytes.len() as i32;
        let ptr = self
            .alloc
            .call(&mut self.store, len)
            .map_err(|e| format!("alloc trapped: {e}"))?;
        if len > 0 {
            self.memory
                .write(&mut self.store, ptr as usize, bytes)
                .map_err(|e| format!("memory write: {e}"))?;
        }
        Ok((ptr, len))
    }

    fn score(&mut self, q: &str, gt: &str, ma: &str) -> Result<f32, String> {
        let (qp, ql) = self.write(q)?;
        let (gp, gl) = self.write(gt)?;
        let (mp, ml) = self.write(ma)?;
        self.rank
            .call(&mut self.store, (qp, ql, gp, gl, mp, ml))
            .map_err(|e| format!("rank_answer trapped: {e}"))
    }
}

fn stddev(xs: &[f32]) -> f32 {
    if xs.len() < 2 {
        return 0.0;
    }
    let n = xs.len() as f32;
    let mean = xs.iter().sum::<f32>() / n;
    (xs.iter().map(|x| (x - mean).powi(2)).sum::<f32>() / n).sqrt()
}

struct Report {
    margin: f32,
    wins: usize,
    ties: usize,
    worst_self_match: f32,
    stddev: f32,
    good: Vec<f32>,
    bad: Vec<f32>,
}

fn run(path: &str, cases: &[(String, String, String, String, String)]) -> Result<Report, String> {
    let mut s = Scorer::load(path)?;
    let (mut good, mut bad, mut selfm, mut all) = (vec![], vec![], vec![], vec![]);
    for (q, gt, g, b, _) in cases {
        let sg = s.score(q, gt, g)?;
        let sb = s.score(q, gt, b)?;
        let ss = s.score(q, gt, gt)?; // the self-match probe: answer IS the ground truth
        good.push(sg);
        bad.push(sb);
        selfm.push(ss);
        all.push(sg);
        all.push(sb);
    }
    let n = cases.len() as f32;
    let margin = good.iter().zip(&bad).map(|(g, b)| g - b).sum::<f32>() / n;
    let wins = good.iter().zip(&bad).filter(|(g, b)| g > b).count();
    let ties = good.iter().zip(&bad).filter(|(g, b)| (*g - *b).abs() < f32::EPSILON).count();
    let worst_self_match = selfm.iter().cloned().fold(f32::INFINITY, f32::min);
    Ok(Report { margin, wins, ties, worst_self_match, stddev: stddev(&all), good, bad })
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("usage: bench <champion.wasm> <candidate.wasm> [benchmark.json]");
        std::process::exit(2);
    }
    let bench_path = args.get(3).cloned().unwrap_or_else(|| "data/benchmark.json".to_string());
    // Which distractor column to score against: the plausible-wrong near-miss (default)
    // or the unrelated cross-match. The champion behaves completely differently on each.
    // "mix" (default) interleaves both distractor types at NEARMISS_PCT, calibrated so the
    // champion reproduces the only numbers Telegraph publishes about its own hidden
    // benchmark (margin ~0.05, 19/32 wins). "bad" and "bad_unrelated" force one regime.
    let bad_field = env::var("BAD_FIELD").unwrap_or_else(|_| "mix".to_string());
    let nearmiss_pct: usize = env::var("NEARMISS_PCT").ok().and_then(|v| v.parse().ok()).unwrap_or(40);
    let raw = fs::read_to_string(&bench_path).unwrap_or_else(|e| {
        eprintln!("cannot read {bench_path}: {e}");
        std::process::exit(2);
    });
    let doc: serde_json::Value = serde_json::from_str(&raw).unwrap_or_else(|e| {
        eprintln!("bad json in {bench_path}: {e}");
        std::process::exit(2);
    });
    let cases: Vec<(String, String, String, String, String)> = doc["cases"]
        .as_array()
        .expect("benchmark.json needs a `cases` array")
        .iter()
        .map(|c| {
            let g = |k: &str| c[k].as_str().unwrap_or_default().to_string();
            match bad_field.as_str() {
                "bad_unrelated" => (g("q"), g("gt"), g("good"), g("bad_unrelated"), "unrelated".to_string()),
                "bad" => (g("q"), g("gt"), g("good"), g("bad"), g("bad_kind")),
                _ => (g("q"), g("gt"), g("good"), String::new(), String::new()), // filled below
            }
        })
        .collect();

    // Deterministic interleave for "mix": every case is assigned by its index so the set
    // is stable across runs and across the two modules being compared.
    let mut cases = cases;
    if bad_field == "mix" {
        let arr = doc["cases"].as_array().unwrap();
        for (i, c) in cases.iter_mut().enumerate() {
            // Evenly spread, not blocked: (i*pct) mod 100 < pct selects exactly pct% of
            // indices in a repeating pattern, so both regimes are sampled throughout.
            let use_near = (i * nearmiss_pct) % 100 < nearmiss_pct;
            let (field, kind) = if use_near {
                ("bad", arr[i]["bad_kind"].as_str().unwrap_or("plausible_wrong").to_string())
            } else {
                ("bad_unrelated", "unrelated".to_string())
            };
            c.3 = arr[i][field].as_str().unwrap_or_default().to_string();
            c.4 = kind;
        }
    }

    let champ = run(&args[1], &cases).unwrap_or_else(|e| {
        eprintln!("champion: {e}");
        std::process::exit(1);
    });
    let cand = run(&args[2], &cases).unwrap_or_else(|e| {
        eprintln!("candidate: {e}");
        std::process::exit(1);
    });

    println!("benchmark: {} ({} cases, distractor = `{}`)\n", bench_path, cases.len(), bad_field);
    println!("{:<26} {:>12} {:>12}", "field", "champion", "candidate");
    println!("{}", "-".repeat(52));
    println!("{:<26} {:>12.4} {:>12.4}", "margin", champ.margin, cand.margin);
    println!("{:<26} {:>12} {:>12}", "wins", format!("{}/{}", champ.wins, cases.len()), format!("{}/{}", cand.wins, cases.len()));
    println!("{:<26} {:>12} {:>12}", "ties (good == bad)", champ.ties, cand.ties);
    println!("{:<26} {:>12.4} {:>12.4}", "worst_self_match", champ.worst_self_match, cand.worst_self_match);
    println!("{:<26} {:>12.4} {:>12.4}", "score_stddev", champ.stddev, cand.stddev);
    println!("{:<26} {:>12} {:>12}", "comparable_cases", cases.len(), cases.len());

    // The three Stage-2 gates, evaluated the way the node evaluates them.
    println!("\nStage-2 gates for the candidate:");
    let g1 = cand.worst_self_match >= 0.75;
    let g2 = cand.stddev > 0.01;
    let g3 = cand.wins >= champ.wins && cand.margin >= champ.margin;
    let mark = |ok: bool| if ok { "PASS" } else { "FAIL" };
    println!("  [{}] worst_self_match >= 0.75          ({:.4})", mark(g1), cand.worst_self_match);
    println!("  [{}] scores vary (stddev above floor)  ({:.4})", mark(g2), cand.stddev);
    println!("  [{}] wins >= champion AND margin >= champion", mark(g3));
    println!("\n  => {}", if g1 && g2 && g3 { "PROMOTED" } else { "REJECTED" });

    // Machine-readable per-case dump: lets mix calibration and design analysis happen
    // offline in one pass, without rebuilding or re-running the modules.
    if env::var("DUMP").as_deref() == Ok("csv") {
        println!("\nidx,kind,champ_good,champ_bad,cand_good,cand_bad");
        for i in 0..cases.len() {
            println!("{},{},{:.6},{:.6},{:.6},{:.6}", i, cases[i].4,
                     champ.good[i], champ.bad[i], cand.good[i], cand.bad[i]);
        }
    }

    // Per-case detail, worst separation first: this is where the design work happens.
    let mut rows: Vec<(usize, f32, f32)> = (0..cases.len())
        .map(|i| (i, cand.good[i] - cand.bad[i], champ.good[i] - champ.bad[i]))
        .collect();
    rows.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());
    println!("\nworst candidate separation (cand_sep | champ_sep | kind | question):");
    for (i, cs, hs) in rows.iter().take(8) {
        println!("  {:+.3} | {:+.3} | {:<16} | {}", cs, hs, cases[*i].4, cases[*i].0);
    }
}
