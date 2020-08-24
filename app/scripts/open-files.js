// const ipcMain = require('electron')
// const dialog  = require('electron')
// const BrowserWindow = require('electron')
//
// ///// SPARC folders
//
// //code
// ipcMain.on('open-file-dialog-code', (event) => {
//   dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
//     properties: ['openFile', 'multiSelections']
//   }, (files) => {
//     if (files) {
//       event.sender.send('selected-code', files);
//     }
//   })
// })
//
// ipcMain.on('open-folder-dialog-code', (event) => {
//   dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
//     properties: ['openDirectory', 'multiSelections']
//   }, (files) => {
//     if (files) {
//       event.sender.send('selected-code', files);
//     }
//   })
// })
