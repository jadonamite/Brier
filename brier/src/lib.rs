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

fn extract_confidence(answer: &str) -> Option<f32> {
    let target = "\"confidence\":";
    if let Some(idx) = answer.find(target) {
        let after = &answer[idx + target.len()..];
        let after = after.trim_start();
        
        let mut end_idx = 0;
        for (i, c) in after.char_indices() {
            if c.is_ascii_digit() || c == '.' {
                end_idx = i + c.len_utf8();
            } else {
                break;
            }
        }
        
        if end_idx > 0 {
            let num_str = &after[..end_idx];
            if let Ok(num) = num_str.parse::<f32>() {
                return Some(num);
            }
        }
    }
    None
}

fn score(ground_truth: &str, miner_answer: &str) -> f32 {
    if miner_answer == ground_truth {
        return 1.0;
    }

    let base_score = f1_score(miner_answer, ground_truth);
    
    if let Some(conf) = extract_confidence(miner_answer) {
        let diff = conf - base_score;
        let brier = 1.0 - (diff * diff);
        return brier.clamp(0.0, 1.0);
    }
    
    base_score
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
