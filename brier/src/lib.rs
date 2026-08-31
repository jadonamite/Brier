#![no_std]
use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

const HEAP_SIZE: usize = 1 * 1024 * 1024;
static mut HEAP: [u8; HEAP_SIZE] = [0u8; HEAP_SIZE];
static mut HEAP_OFFSET: usize = 0;

#[unsafe(no_mangle)]
pub unsafe extern "C" fn alloc(size: i32) -> i32 {
    let size = size.max(0) as usize;
    unsafe {
        let aligned = (HEAP_OFFSET + 3) & !3;
        if aligned + size > HEAP_SIZE {
            HEAP_OFFSET = 0;
        } else {
            HEAP_OFFSET = aligned;
        }
        let ptr = core::ptr::addr_of_mut!(HEAP).cast::<u8>().add(HEAP_OFFSET);
        HEAP_OFFSET += size;
        ptr as i32
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dealloc(_ptr: i32, _size: i32) {}

unsafe fn read_str<'a>(ptr: i32, len: i32) -> &'a str {
    unsafe {
        let slice = core::slice::from_raw_parts(ptr as *const u8, len.max(0) as usize);
        core::str::from_utf8_unchecked(slice)
    }
}

fn strip_punc(s: &str, buf: &mut [u8]) -> usize {
    let mut len = 0;
    for b in s.bytes() {
        if len >= buf.len() { break; } // prevent panic on large input
        if b.is_ascii_alphanumeric() || b == b' ' {
            buf[len] = b.to_ascii_lowercase();
            len += 1;
        }
    }
    len
}

fn is_stop_word(w: &str) -> bool {
    matches!(w, "is" | "the" | "in" | "at" | "a" | "an" | "of" | "to" | "and" | "by" | "for" | "on" | "with" | "as" | "are" | "was" | "were" | "it" | "has" | "have" | "had" | "this" | "that")
}

fn f1_score(answer: &str, ground_truth: &str) -> f32 {
    let mut ans_buf = [0u8; 32768];
    let mut gt_buf = [0u8; 32768];
    
    let ans_len = strip_punc(answer, &mut ans_buf);
    let gt_len = strip_punc(ground_truth, &mut gt_buf);
    
    let ans_clean = core::str::from_utf8(&ans_buf[..ans_len]).unwrap_or("");
    let gt_clean = core::str::from_utf8(&gt_buf[..gt_len]).unwrap_or("");

    let mut ans_words = 0u32;
    let mut gt_words = 0u32;
    let mut matched = 0u32;

    for w in gt_clean.split_whitespace() {
        if !is_stop_word(w) {
            gt_words += 1;
        }
    }

    if gt_words == 0 {
        return 0.0;
    }

    for a_word in ans_clean.split_whitespace() {
        if is_stop_word(a_word) {
            continue;
        }
        ans_words += 1;
        if gt_clean.split_whitespace().any(|g_word| g_word == a_word) {
            matched += 1;
        }
    }

    if ans_words == 0 {
        return 0.0;
    }

    let precision = matched as f32 / ans_words as f32;
    let recall = matched as f32 / gt_words as f32;

    if precision + recall == 0.0 {
        0.0
    } else {
        2.0 * precision * recall / (precision + recall)
    }
}

const CONF_KEY: &str = "confidence";

/// Locates the confidence field: returns (start of the key, end of its number).
fn find_conf(s: &str) -> Option<(usize, usize)> {
    let k = s.find(CONF_KEY)?;
    let b = s.as_bytes();
    let start = if k > 0 && b[k - 1] == b'"' { k - 1 } else { k };

    let mut i = k + CONF_KEY.len();
    while i < b.len() && b[i] != b':' {
        if b[i] != b'"' && !b[i].is_ascii_whitespace() {
            return None;
        }
        i += 1;
    }
    if i >= b.len() {
        return None;
    }
    i += 1;
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    let num_start = i;
    while i < b.len() && (b[i].is_ascii_digit() || b[i] == b'.') {
        i += 1;
    }
    if i == num_start {
        return None;
    }
    Some((start, i))
}

fn push_bytes(src: &str, buf: &mut [u8], mut len: usize) -> usize {
    for b in src.bytes() {
        if len >= buf.len() {
            break;
        }
        buf[len] = b;
        len += 1;
    }
    len
}

/// Reads the quoted value of `key`, if the miner returned a structured answer.
fn quoted_value<'a>(s: &'a str, key: &str) -> Option<&'a str> {
    let k = s.find(key)?;
    let b = s.as_bytes();
    let mut i = k + key.len();
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    if i >= b.len() || b[i] != b'"' {
        return None;
    }
    i += 1;
    let vs = i;
    while i < b.len() && b[i] != b'"' {
        i += 1;
    }
    s.get(vs..i)
}

/// Copies the answer's content into `buf`, dropping the confidence metadata. The declared
/// probability is a claim about the answer, not part of it, and must not be scored as text.
fn extract_content(answer: &str, buf: &mut [u8]) -> usize {
    if let Some(v) = quoted_value(answer, "\"answer\":") {
        return push_bytes(v, buf, 0);
    }
    match find_conf(answer) {
        Some((start, end)) => {
            let len = push_bytes(&answer[..start], buf, 0);
            push_bytes(&answer[end..], buf, len)
        }
        None => push_bytes(answer, buf, 0),
    }
}

/// Accepts both the 0-1 and the percentage convention. A miner reporting 85 rather than
/// 0.85 is using a different scale, not making a different claim.
fn normalize_conf(c: f32) -> f32 {
    let c = if c > 1.0 && c <= 100.0 { c / 100.0 } else { c };
    if c < 0.0 {
        0.0
    } else if c > 1.0 {
        1.0
    } else {
        c
    }
}

fn extract_confidence(answer: &str) -> Option<f32> {
    let (_, end) = find_conf(answer)?;
    let b = answer.as_bytes();
    let mut s = end;
    while s > 0 && (b[s - 1].is_ascii_digit() || b[s - 1] == b'.') {
        s -= 1;
    }
    let raw = answer.get(s..end)?.parse::<f32>().ok()?;
    Some(normalize_conf(raw))
}

const CALIBRATION_WEIGHT: f32 = 1.0;

fn score(ground_truth: &str, miner_answer: &str) -> f32 {
    if miner_answer == ground_truth {
        return 1.0;
    }

    let mut content = [0u8; 32768];
    let n = extract_content(miner_answer, &mut content);
    let text = core::str::from_utf8(&content[..n]).unwrap_or(miner_answer);

    let accuracy = f1_score(text, ground_truth);

    match extract_confidence(miner_answer) {
        // Calibration modulates accuracy, it never substitutes for it. An answer carrying
        // nothing true scores nothing, however well it predicted its own failure -- and
        // because the multiplier is fixed in the forecast, reporting the honest
        // probability is still the strictly optimal report.
        Some(conf) => {
            let err = conf - accuracy;
            let calibrated = accuracy * (1.0 - CALIBRATION_WEIGHT * err * err);
            if calibrated < 0.0 {
                0.0
            } else if calibrated > 1.0 {
                1.0
            } else {
                calibrated
            }
        }
        None => accuracy,
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn rank_answer(
    _q_ptr: i32,
    _q_len: i32,
    gt_ptr: i32,
    gt_len: i32,
    ma_ptr: i32,
    ma_len: i32,
) -> f32 {
    unsafe {
        let ground_truth = read_str(gt_ptr, gt_len);
        let miner_answer = read_str(ma_ptr, ma_len);
        if miner_answer.trim().is_empty() {
            return 0.0;
        }
        score(ground_truth, miner_answer)
    }
}
