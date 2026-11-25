use tauri::ipc::{InvokeBody, Request};
use tauri::WebviewWindow;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn save_export(
    window: WebviewWindow,
    request: Request<'_>,
) -> Result<Option<String>, String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("无效的导出文件数据".into());
    };
    let bytes = bytes.clone();
    let file_name = request
        .headers()
        .get("x-vnweb-file-name")
        .and_then(|value| value.to_str().ok())
        .and_then(|name| {
            percent_encoding::percent_decode_str(name)
                .decode_utf8()
                .ok()
        })
        .filter(|name| {
            !name
                .chars()
                .any(|c| c.is_control() || r#"\/:*?"<>|"#.contains(c))
        })
        .ok_or("无效的导出文件名")?
        .into_owned();
    let (filter, extension) = match file_name.rsplit_once('.').map(|(_, ext)| ext) {
        Some("xlsx") => ("Excel 工作簿", "xlsx"),
        Some("zip") => ("ZIP 压缩文件", "zip"),
        Some("png") => ("PNG 图像", "png"),
        _ => return Err("不支持的导出文件类型".into()),
    };

    tauri::async_runtime::spawn_blocking(move || {
        let destination = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("保存导出文件")
            .set_file_name(file_name)
            .add_filter(filter, &[extension])
            .blocking_save_file();
        let Some(destination) = destination else {
            return Ok(None);
        };
        let path = destination.into_path().map_err(|error| error.to_string())?;
        std::fs::write(&path, bytes).map_err(|error| error.to_string())?;
        Ok(Some(path.to_string_lossy().into_owned()))
    })
    .await
    .map_err(|error| error.to_string())?
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GamePathKind {
    Executable,
    SaveDirectory,
}

#[tauri::command]
pub async fn pick_game_path(
    window: WebviewWindow,
    kind: GamePathKind,
) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dialog = window.dialog().file().set_parent(&window);
        let selected = match kind {
            GamePathKind::Executable => dialog
                .set_title("选择游戏可执行文件")
                .add_filter("可执行文件", &["exe"])
                .add_filter("所有文件", &["*"])
                .blocking_pick_file(),
            GamePathKind::SaveDirectory => {
                dialog.set_title("选择游戏存档目录").blocking_pick_folder()
            }
        };
        selected
            .map(|file| {
                file.into_path()
                    .map(|path| path.to_string_lossy().into_owned())
            })
            .transpose()
            .map_err(|error| error.to_string())
    })
    .await
    .map_err(|error| error.to_string())?
}
