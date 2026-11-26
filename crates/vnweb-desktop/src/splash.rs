use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

use tauri::http::{header, Request, Response, StatusCode};

const MAX_OPEN_RANGE_BYTES: u64 = 4 * 1024 * 1024;

pub fn is_safe_single_filename(name: &str) -> bool {
    !name.is_empty()
        && name != "."
        && name != ".."
        && !name.contains('/')
        && !name.contains('\\')
        && !name.contains("..")
        && !name.contains('%')
        && !name.contains('\0')
}

fn hex_value(byte: u8) -> Option<u8> {
    match byte {
        b'0'..=b'9' => Some(byte - b'0'),
        b'a'..=b'f' => Some(byte - b'a' + 10),
        b'A'..=b'F' => Some(byte - b'A' + 10),
        _ => None,
    }
}

pub fn percent_decode_utf8(input: &str) -> Option<String> {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;

    while i < bytes.len() {
        if bytes[i] == b'%' {
            let hi = hex_value(*bytes.get(i + 1)?)?;
            let lo = hex_value(*bytes.get(i + 2)?)?;
            let decoded = (hi << 4) | lo;
            if decoded == 0 {
                return None;
            }
            out.push(decoded);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }

    String::from_utf8(out).ok()
}

pub fn mime_type_for_extension(name: &str) -> &'static str {
    let ext = Path::new(name)
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase);

    match ext.as_deref() {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("avif") => "image/avif",
        Some("svg") => "image/svg+xml",
        Some("ico") => "image/x-icon",
        Some("bmp") => "image/bmp",
        Some("mp4") => "video/mp4",
        Some("webm") => "video/webm",
        Some("ogg") => "video/ogg",
        Some("mov") => "video/quicktime",
        Some("m4v") => "video/x-m4v",
        _ => "application/octet-stream",
    }
}

pub fn parse_byte_range(range_header: &str, total_size: u64, max_chunk: u64) -> Option<(u64, u64)> {
    if total_size == 0 || max_chunk == 0 {
        return None;
    }

    let trimmed = range_header.trim();
    let prefix = trimmed.get(..6)?;
    if !prefix.eq_ignore_ascii_case("bytes=") {
        return None;
    }
    let spec = trimmed[6..].trim();
    if spec.contains(',') {
        return None;
    }

    let (start_str, end_str) = spec.split_once('-')?;
    let start_str = start_str.trim();
    let end_str = end_str.trim();

    if start_str.is_empty() && end_str.is_empty() {
        return None;
    }

    if start_str.is_empty() {
        let suffix: u64 = end_str.parse().ok()?;
        if suffix == 0 {
            return None;
        }
        let start = total_size.saturating_sub(suffix);
        let end = (total_size - 1).min(start.saturating_add(max_chunk - 1));
        return Some((start, end));
    }

    let start: u64 = start_str.parse().ok()?;
    if start >= total_size {
        return None;
    }

    let raw_end = if end_str.is_empty() {
        total_size - 1
    } else {
        let parsed_end: u64 = end_str.parse().ok()?;
        if parsed_end < start {
            return None;
        }
        parsed_end.min(total_size - 1)
    };

    let end = raw_end.min(start.saturating_add(max_chunk - 1));
    Some((start, end))
}

fn plain_response(status: StatusCode, body: &[u8]) -> Response<Vec<u8>> {
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, "text/plain; charset=utf-8")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(body.to_vec())
        .unwrap_or_else(|_| Response::new(Vec::new()))
}

pub fn handle_splash_protocol(data_dir: &Path, request: Request<Vec<u8>>) -> Response<Vec<u8>> {
    let raw_path = request.uri().path().trim_start_matches('/');
    let (asset_subdir, encoded_name) = if let Some(rest) = raw_path
        .strip_prefix("app-icon/")
        .or_else(|| raw_path.strip_prefix("app-icon%2F"))
        .or_else(|| raw_path.strip_prefix("app-icon%2f"))
    {
        ("app", rest)
    } else {
        ("startup", raw_path)
    };

    let Some(decoded_name) = percent_decode_utf8(encoded_name) else {
        return plain_response(StatusCode::BAD_REQUEST, b"Invalid startup media path");
    };
    if !is_safe_single_filename(&decoded_name) {
        return plain_response(StatusCode::BAD_REQUEST, b"Invalid startup media path");
    }

    let file_path = data_dir
        .join("assets")
        .join(asset_subdir)
        .join(&decoded_name);
    let Ok(mut file) = File::open(&file_path) else {
        return plain_response(StatusCode::NOT_FOUND, b"Startup media not found");
    };
    let Ok(meta) = file.metadata() else {
        return plain_response(StatusCode::NOT_FOUND, b"Startup media not found");
    };
    if !meta.is_file() {
        return plain_response(StatusCode::NOT_FOUND, b"Startup media not found");
    }

    let total_size = meta.len();
    let mime = mime_type_for_extension(&decoded_name);

    if let Some(range_value) = request.headers().get(header::RANGE) {
        let Ok(range_str) = range_value.to_str() else {
            return Response::builder()
                .status(StatusCode::RANGE_NOT_SATISFIABLE)
                .header(header::CONTENT_RANGE, format!("bytes */{total_size}"))
                .header(header::ACCEPT_RANGES, "bytes")
                .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .body(Vec::new())
                .unwrap_or_else(|_| Response::new(Vec::new()));
        };

        let Some((start, end)) = parse_byte_range(range_str, total_size, MAX_OPEN_RANGE_BYTES)
        else {
            return Response::builder()
                .status(StatusCode::RANGE_NOT_SATISFIABLE)
                .header(header::CONTENT_RANGE, format!("bytes */{total_size}"))
                .header(header::ACCEPT_RANGES, "bytes")
                .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .body(Vec::new())
                .unwrap_or_else(|_| Response::new(Vec::new()));
        };

        let length = end - start + 1;
        let mut buffer = Vec::with_capacity(length as usize);
        if file.seek(SeekFrom::Start(start)).is_err()
            || file.take(length).read_to_end(&mut buffer).is_err()
        {
            return plain_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                b"Failed to read startup media",
            );
        }

        return Response::builder()
            .status(StatusCode::PARTIAL_CONTENT)
            .header(header::CONTENT_TYPE, mime)
            .header(
                header::CONTENT_RANGE,
                format!("bytes {start}-{end}/{total_size}"),
            )
            .header(header::ACCEPT_RANGES, "bytes")
            .header(header::CONTENT_LENGTH, buffer.len().to_string())
            .header(header::CACHE_CONTROL, "no-store")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .body(buffer)
            .unwrap_or_else(|_| Response::new(Vec::new()));
    }

    let Ok(bytes) = std::fs::read(&file_path) else {
        return plain_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            b"Failed to read startup media",
        );
    };

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, mime)
        .header(header::ACCEPT_RANGES, "bytes")
        .header(header::CONTENT_LENGTH, bytes.len().to_string())
        .header(header::CACHE_CONTROL, "no-store")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(bytes)
        .unwrap_or_else(|_| Response::new(Vec::new()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn make_temp_dir(label: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let dir = env::temp_dir().join(format!("vnweb-desktop-splash-{label}-{nanos}"));
        fs::create_dir_all(&dir).expect("create temp dir");
        dir
    }

    #[test]
    fn parses_byte_ranges_correctly() {
        assert_eq!(parse_byte_range("bytes=0-9", 100, 50), Some((0, 9)));
        assert_eq!(parse_byte_range("bytes=10-", 100, 20), Some((10, 29)));
        assert_eq!(parse_byte_range("bytes=90-", 100, 50), Some((90, 99)));
        assert_eq!(parse_byte_range("bytes=-15", 100, 50), Some((85, 99)));
        assert_eq!(parse_byte_range("bytes=100-120", 100, 50), None);
        assert_eq!(parse_byte_range("bytes=20-10", 100, 50), None);
        assert_eq!(parse_byte_range("items=0-5", 100, 50), None);
    }

    #[test]
    fn rejects_traversal_and_serves_ranged_startup_media() {
        let data_dir = make_temp_dir("protocol");
        let startup_dir = data_dir.join("assets").join("startup");
        fs::create_dir_all(&startup_dir).expect("startup dir");
        fs::write(startup_dir.join("intro.mp4"), b"0123456789abcdef").expect("write video");

        let traversal_req = Request::builder()
            .uri("http://vnweb-splash.localhost/..%2Fsecret.txt")
            .body(Vec::new())
            .expect("req");
        assert_eq!(
            handle_splash_protocol(&data_dir, traversal_req).status(),
            StatusCode::BAD_REQUEST
        );

        let missing_req = Request::builder()
            .uri("http://vnweb-splash.localhost/missing.mp4")
            .body(Vec::new())
            .expect("req");
        assert_eq!(
            handle_splash_protocol(&data_dir, missing_req).status(),
            StatusCode::NOT_FOUND
        );

        let range_req = Request::builder()
            .uri("http://vnweb-splash.localhost/intro.mp4")
            .header(header::RANGE, "bytes=2-5")
            .body(Vec::new())
            .expect("req");
        let res = handle_splash_protocol(&data_dir, range_req);
        assert_eq!(res.status(), StatusCode::PARTIAL_CONTENT);
        assert_eq!(res.body(), b"2345");
        assert_eq!(
            res.headers()
                .get(header::CONTENT_RANGE)
                .and_then(|v| v.to_str().ok()),
            Some("bytes 2-5/16")
        );

        let _ = fs::remove_dir_all(&data_dir);
    }

    #[test]
    fn percent_decodes_unicode_filenames_and_rejects_malformed_escapes() {
        let data_dir = make_temp_dir("unicode");
        let startup_dir = data_dir.join("assets").join("startup");
        fs::create_dir_all(&startup_dir).expect("startup dir");
        fs::write(startup_dir.join("魔法 intro.mp4"), b"abcdef012345").expect("write video");

        let ok_req = Request::builder()
            .uri("http://vnweb-splash.localhost/%E9%AD%94%E6%B3%95%20intro.mp4")
            .body(Vec::new())
            .expect("req");
        let ok_res = handle_splash_protocol(&data_dir, ok_req);
        assert_eq!(ok_res.status(), StatusCode::OK);
        assert_eq!(ok_res.body(), b"abcdef012345");

        let range_req = Request::builder()
            .uri("http://vnweb-splash.localhost/%E9%AD%94%E6%B3%95%20intro.mp4")
            .header(header::RANGE, "bytes=6-9")
            .body(Vec::new())
            .expect("req");
        let range_res = handle_splash_protocol(&data_dir, range_req);
        assert_eq!(range_res.status(), StatusCode::PARTIAL_CONTENT);
        assert_eq!(range_res.body(), b"0123");

        let encoded_backslash_req = Request::builder()
            .uri("http://vnweb-splash.localhost/%2e%2e%5csecret.txt")
            .body(Vec::new())
            .expect("req");
        assert_eq!(
            handle_splash_protocol(&data_dir, encoded_backslash_req).status(),
            StatusCode::BAD_REQUEST
        );

        let invalid_hex_req = Request::builder()
            .uri("http://vnweb-splash.localhost/%ZZ.mp4")
            .body(Vec::new())
            .expect("req");
        assert_eq!(
            handle_splash_protocol(&data_dir, invalid_hex_req).status(),
            StatusCode::BAD_REQUEST
        );

        let _ = fs::remove_dir_all(&data_dir);
    }

    #[test]
    fn serves_app_icon_and_rejects_traversal() {
        let data_dir = make_temp_dir("app-icon");
        let app_dir = data_dir.join("assets").join("app");
        fs::create_dir_all(&app_dir).expect("app dir");
        fs::write(app_dir.join("brand.svg"), b"<svg/>").expect("write svg");

        let direct_req = Request::builder()
            .uri("http://vnweb-splash.localhost/app-icon/brand.svg")
            .body(Vec::new())
            .expect("req");
        let direct_res = handle_splash_protocol(&data_dir, direct_req);
        assert_eq!(direct_res.status(), StatusCode::OK);
        assert_eq!(direct_res.body(), b"<svg/>");

        let encoded_req = Request::builder()
            .uri("http://vnweb-splash.localhost/app-icon%2Fbrand.svg")
            .body(Vec::new())
            .expect("req");
        let encoded_res = handle_splash_protocol(&data_dir, encoded_req);
        assert_eq!(encoded_res.status(), StatusCode::OK);
        assert_eq!(encoded_res.body(), b"<svg/>");

        let traversal_req = Request::builder()
            .uri("http://vnweb-splash.localhost/app-icon%2F..%2Fsecret.png")
            .body(Vec::new())
            .expect("req");
        assert_eq!(
            handle_splash_protocol(&data_dir, traversal_req).status(),
            StatusCode::BAD_REQUEST
        );

        let _ = fs::remove_dir_all(&data_dir);
    }
}
