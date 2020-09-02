//////////// FILE BROWSERS to import existing files and folders /////////////////////

addFiles.addEventListener("click", function() {
   dialog.showOpenDialog({ properties: ['openFile', 'multiSelections']
 }).then(result => {
      var filtered = getGlobalPath()
      var myPath = getRecursivePath(filtered)
      addFilesfunction(result.filePaths, myPath)
  })
})


addFolders.addEventListener("click", function() {
  dialog.showOpenDialog({ properties: ['openDirectory', 'multiSelections']
  }).then(result => {
      var filtered = getGlobalPath()
      var myPath = getRecursivePath(filtered)
      addFoldersfunction(result.filePaths, myPath)
  })
})

function addFoldersfunction(folderArray, currentLocation) {

  if (globalPath.value === "/") {
    bootbox.alert({
      message: "Other non-SPARC folders cannot be added to this dataset level!",
      centerVertical: true
    })
  } else {

    // check for duplicates/folders with the same name
    for (var i=0; i<folderArray.length;i++) {
      var baseName = path.basename(folderArray[i])
      var duplicate = false;
      for (var objKey in currentLocation) {
        if (typeof currentLocation[objKey] === "object") {
          if (baseName === objKey) {
            duplicate = true
            break
          }
        }
      }
      if (duplicate) {
        bootbox.alert({
          message: 'Duplicate folder name: ' + baseName,
          centerVertical: true
        })
      } else {

        currentLocation[baseName] = {}
        populateJSONObjFolder(currentLocation[baseName], folderArray[i])

        var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

        $('#items').html(appendString)

        listItems(currentLocation)
        getInFolder()
      }
    }
  }
}

function addFilesfunction(fileArray, currentLocation) {

  // check for duplicate or files with the same name
    for (var i=0; i<fileArray.length;i++) {
      var baseName = path.basename(fileArray[i])

      if (globalPath.value === "/" && (!["dataset_description.xlsx", "dataset_description.csv", "dataset_description.json", "submission.xlsx", "submission.json", "submission.csv", "samples.xlsx", "samples.csv", "samples.json", "subjects.xlsx", "subjects.csv", "subjects.json", "CHANGES.txt", "README.txt"].includes(baseName))) {
        bootbox.alert({
          message: "<p>Invalid file(s). Only SPARC metadata files are allowed in the high-level dataset folder.<br> <ul><li>dataset_description (.xslx/.csv/.json)</li><li>submission (.xslx/.csv/.json)</li><li>subjects (.xslx/.csv/.json)</li><li>samples (.xslx/.csv/.json)</li><li>CHANGES.txt</li><li>README.txt</li></ul></p>",
          centerVertical: true
        })
        break
      } else {
        var duplicate = false;
        for (var objKey in currentLocation) {
          if (Array.isArray(currentLocation[objKey])) {
            if (baseName === objKey) {
              duplicate = true
              break
            }
          }
        }
        if (duplicate) {
          bootbox.alert({
            message: 'Duplicate file name: ' + baseName,
            centerVertical: true
          })
        } else {
          currentLocation[baseName] = [fileArray[i], "", ""]
          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

          $('#items').html(appendString)

          listItems(currentLocation)
          getInFolder()
        }
      }
  }
}


//// Add files or folders with drag&drop
function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  // get global path
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered)
  ev.preventDefault();

  for (var i=0; i<ev.dataTransfer.files.length;i++) {
    /// Get all the file information
    var itemPath = ev.dataTransfer.files[i].path
    var itemName = ev.dataTransfer.files[i].name
    var duplicate = false

    var statsObj = fs.statSync(itemPath)

    // check for duplicate or files with the same name
    for (var j=0; j<ev.target.children.length;j++) {
      if (itemName === ev.target.children[j].innerText) {
        duplicate = true
        break
      }
    }

    /// check for File duplicate
    if (statsObj.isFile()) {
      if (globalPath.value === "/") {
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate file name: " + itemName,
            centerVertical: true
          })
        } else {
            if (!["dataset_description.xlsx", "submission.xlsx", "samples.xlsx", "subjects.xlsx", "README.txt"].includes(itemName)) {
              bootbox.alert({
                message: "Invalid file(s). Only SPARC metadata files are allowed in the high-level dataset folder.<br> <ul><li>dataset_description (.xslx/.csv/.json)</li><li>submission (.xslx/.csv/.json)</li><li>subjects (.xslx/.csv/.json)</li><li>samples (.xslx/.csv/.json)</li><li>CHANGES.txt</li><li>README.txt</li></ul>",
                centerVertical: true
              })
            } else {
              myPath[itemName] = [itemPath, "", ""]

              var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
              $(appendString).appendTo(ev.target);

              listItems(myPath)
              getInFolder()
            }
        }
      } else {
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate file name: " + itemName,
            centerVertical: true
          })
        } else {
          myPath[itemName] = [itemPath, "", ""]

          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);

          listItems(myPath)
          getInFolder()
        }
      }
    } else if (statsObj.isDirectory()) {
      /// drop a folder
      if (globalPath.value === "/") {
        bootbox.alert({
          message: "Other non-SPARC folders cannot be added to this dataset level!",
          centerVertical: true
        })
      } else {
        if (duplicate) {
          bootbox.alert({
            message: 'Duplicate folder name: ' + itemName,
            centerVertical: true
          })
        } else {
          var currentPath = globalPath.value
          var jsonPathArray = currentPath.split("/")
          var filtered = jsonPathArray.filter(function (el) {
            return el != "";
          });

          var myPath = getRecursivePath(filtered)

          var folderJsonObject = {};

          populateJSONObjFolder(folderJsonObject, itemPath)

          myPath[itemName] = folderJsonObject

          var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);

          listItems(myPath)
          getInFolder()
        }
      }
    }
  }
}
