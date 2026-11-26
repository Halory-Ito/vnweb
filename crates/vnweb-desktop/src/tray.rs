use std::sync::atomic::Ordering;

use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};

use crate::paths::{open_dir_in_explorer, open_url_in_browser, AppSettings};
use crate::{show_main_window, AppState};

pub const TRAY_ID: &str = "vnweb-tray";

pub fn build_tray_menu(app: &AppHandle, app_name: &str) -> tauri::Result<Menu<tauri::Wry>> {
    let show_label = format!("打开 {app_name}");
    let quit_label = format!("退出 {app_name}");
    let show_item = MenuItem::with_id(app, "show", show_label, true, None::<&str>)?;
    let browser_item =
        MenuItem::with_id(app, "open-browser", "在浏览器中打开", true, None::<&str>)?;
    let data_dir_item = MenuItem::with_id(app, "open-data", "打开数据目录", true, None::<&str>)?;
    let restart_item =
        MenuItem::with_id(app, "restart-server", "重启本地服务", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", quit_label, true, None::<&str>)?;

    Menu::with_items(
        app,
        &[
            &show_item,
            &browser_item,
            &data_dir_item,
            &restart_item,
            &separator,
            &quit_item,
        ],
    )
}

pub fn setup_tray(
    app: &AppHandle,
    app_settings: &AppSettings,
    custom_icon: Option<Image<'static>>,
) -> tauri::Result<()> {
    let menu = build_tray_menu(app, &app_settings.name)?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
        .tooltip(&app_settings.name)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => show_main_window(app),
            "open-browser" => {
                let url = {
                    let state = app.state::<AppState>();
                    state.server.current_url(&state.paths.data_dir)
                };
                let _ = open_url_in_browser(&url);
            }
            "open-data" => {
                let data_dir = app.state::<AppState>().paths.data_dir.clone();
                let _ = open_dir_in_explorer(&data_dir);
            }
            "restart-server" => {
                let app_handle = app.clone();
                std::thread::spawn(move || {
                    let state = app_handle.state::<AppState>();
                    if let Ok(port) = state.server.restart(&state.paths) {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if let Ok(parsed) = format!("http://127.0.0.1:{port}").parse() {
                                let _ = window.navigate(parsed);
                            }
                        }
                    }
                });
            }
            "quit" => {
                let state = app.state::<AppState>();
                state.is_quitting.store(true, Ordering::SeqCst);
                state.server.stop();
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    if let Some(icon) = custom_icon.or_else(|| app.default_window_icon().cloned()) {
        builder = builder.icon(icon);
    }

    builder.build(app)?;
    Ok(())
}

pub fn apply_tray_branding(
    app: &AppHandle,
    app_settings: &AppSettings,
    custom_icon: Option<Image<'static>>,
) -> tauri::Result<()> {
    let Some(tray) = app.tray_by_id(TRAY_ID) else {
        return Ok(());
    };

    tray.set_tooltip(Some(&app_settings.name))?;
    let menu = build_tray_menu(app, &app_settings.name)?;
    tray.set_menu(Some(menu))?;
    if let Some(icon) = custom_icon.or_else(|| app.default_window_icon().cloned()) {
        tray.set_icon(Some(icon))?;
    }

    Ok(())
}
