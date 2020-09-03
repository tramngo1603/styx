const os = require('os');
const path = require('path');
const fs = require('fs');
const $ = require('jquery');
const prompt = require('electron-prompt');
const {ipcRenderer} = require('electron')
const dialog = require('electron').remote.dialog
const electron = require('electron')
const bootbox = require('bootbox')
const app = require('electron').remote.app;

var backFolder = []
var forwardFolder =[]

var highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocols"]

var highLevelFolderToolTip = {
  "code": "code: This folder contains all the source code used in the study (e.g., Python, MATLAB, etc.)",
  "derivative": "derivative: This folder contains data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)",
  "docs": "docs: This folder contains all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)",
  "source": "source: This folder contains very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset.",
  "primary": "primary: This folder contains all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders.",
  "protocol": "protocol: This folder contains supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <b><a href='https://www.protocols.io/groups/sparc'> Protocols.io/sparc </a></b>."
}

var jsonObjGlobal = {
  "code": {
    'empty_directory': {
    }
  },
  "derivative": {},
  "primary": {},
  "source": {
    'empty-directory': {}
  },
  "docs": {},
  "protocols": {},
  // any file's value is a list [full_path, added description, added metadata]
  "submission.csv": ["C:/mypath/folder1/sub-folder-1/submission.csv", "This is my current description.", "This is my sample metadata for this file."],
  "dataset_description.xlsx": ["C:/mypath/folder1/sub-folder-1/dataset_description.xlsx", "This is my current description.", "This is my sample metadata for this file."]
}

var homeDirectory = app.getPath('home')
var progressFile = "currentOrganization.json"
var progressPath = path.join(homeDirectory, "bexplorer", "Progress");

const globalPath = document.getElementById("input-global-path")
const backButton = document.getElementById("button-back")
const addFiles = document.getElementById("add-files")
const addNewFolder = document.getElementById("new-folder")
const addFolders = document.getElementById("add-folders")
const contextMenu = document.getElementById("mycontext")
const fullPathValue = document.querySelector(".hoverPath")
const fullNameValue = document.querySelector(".hoverFullName")
const resetProgress = document.getElementById("clear-progress")
const saveProgress = document.getElementById("save-progress")
const importProgress = document.getElementById("import-progress")
const homePathButton = document.getElementById("home-path")

listItems(jsonObjGlobal)
getInFolder()


function createMetadataDir() {
  try {
  fs.mkdirSync(progressPath, { recursive: true } );
  } catch (error) {
    log.error(error)
    console.log(error)
  }
}

createMetadataDir()

function getGlobalPath() {
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  return filtered
}

// load and parse existing json progress file
function parseJson(path) {
  if (!fs.existsSync(path)) {
    return {}
  }
  try {
    var content = fs.readFileSync(path);
    contentJson = JSON.parse(content);
    return contentJson
  } catch (error) {
    // log.error(error)
    console.log(error);
    return {}
  }
}

/// back button
backButton.addEventListener("click", function() {
  event.preventDefault();
  var currentPath = globalPath.value

  if (currentPath !== "/") {
    var filtered = getGlobalPath()
    if (filtered.length === 1) {
      globalPath.value = "/"
    } else {
      globalPath.value = "/" + filtered.slice(0,filtered.length-1).join("/") + "/"
    }
    var myPath = jsonObjGlobal;
    for (var item of filtered.slice(0,filtered.length-1)) {
      myPath = myPath[item]
    }
    // construct UI with files and folders
    var appendString = loadFileFolder(myPath)

    /// empty the div
    $('#items').empty()
    $('#items').html(appendString)

    // reconstruct div with new elements
    listItems(myPath)
    getInFolder()
  }
})

// Add folder button
addNewFolder.addEventListener("click", function(event) {
  event.preventDefault();
  if(globalPath.value!=="/") {
    var newFolderName = "New Folder"

    // show prompt for name
    bootbox.prompt({
      title: "Adding a new folder...",
      message: "<p>Please enter a name below: </p>",
      centerVertical: true,
      callback: function(result) {

        if(result !== null && result!== "") {
          newFolderName = result.trim()

          // check for duplicate or files with the same name
          var duplicate = false
          var itemDivElements = document.getElementById("items").children
          for (var i=0;i<itemDivElements.length;i++) {
            if (newFolderName === itemDivElements[i].innerText) {
              duplicate = true
              break
            }
          }

          if (duplicate) {
            bootbox.alert({
              message: "Duplicate folder name: " + newFolderName,
              centerVertical: true
            })
          } else {
            var appendString = '';
            appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+ newFolderName +'</div></div>'
            $(appendString).appendTo('#items');

            /// update jsonObjGlobal
            var currentPath = globalPath.value
            var jsonPathArray = currentPath.split("/")
            var filtered = jsonPathArray.filter(function (el) {
              return el != "";
            });

            var myPath = getRecursivePath(filtered)

            // update Json object with new folder created
            var renamedNewFolder = newFolderName
            myPath[renamedNewFolder] = {}

            listItems(myPath)
            getInFolder()
          }
        }
      }
    })
  } else {
      bootbox.alert({
        message: "New folders cannot be added at this level!",
        centerVertical: true
      })
    }
})

// ///////////////////////////////////////////////////////////////////////////

function populateJSONObjFolder(jsonObject, folderPath) {
    var myitems = fs.readdirSync(folderPath)
    myitems.forEach(element => {
      var statsObj = fs.statSync(path.join(folderPath, element))
      var addedElement = path.join(folderPath, element)
      if (statsObj.isDirectory()) {
        jsonObject[element] = {}
        populateJSONObjFolder(jsonObject[element], addedElement)
      } else if (statsObj.isFile()) {
          jsonObject[element] = [addedElement, "", ""]
        }
    });
}

function showFullPath(ev, text) {
  ev.preventDefault()
  fullPathValue.style.display = "block";
  fullPathValue.style.top = `${ev.clientY - 10}px`;
  fullPathValue.style.left = `${ev.clientX + 15}px`;
  fullPathValue.innerHTML = text
}

function hideFullPath() {
  fullPathValue.style.display = "none";
  fullPathValue.style.top = '-210%';
  fullPathValue.style.left = '-210%';
}

/// hover for a full path
function hoverForPath(ev) {
    var currentPath = globalPath.value
    var jsonPathArray = currentPath.split("/")
    var filtered = jsonPathArray.filter(function (el) {
      return el != "";
    });

    var myPath = getRecursivePath(filtered)

    // get full path from JSON object
    var fullPath = myPath[ev.innerText]
    showFullPath(event, fullPath[0])
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  var isOverflowing = element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    ev.preventDefault()
    fullNameValue.style.display = "block";
    fullNameValue.style.top = `${ev.clientY - 10}px`;
    fullNameValue.style.left = `${ev.clientX + 15}px`;
    fullNameValue.innerHTML = text
  }
}

function hideFullName() {
  fullNameValue.style.display = "none";
  fullNameValue.style.top = '-250%';
  fullNameValue.style.left = '-250%';
}

/// hover over a function for full name
function hoverForFullName(ev) {
    var fullPath = ev.innerText

    // ev.children[1] is the child element folder_desc of div.single-item,
    // which we will put through the overflowing check in showFullName function
    showFullName(event, ev.children[1], fullPath)
}

// If the document is clicked somewhere
document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value !== "myFile") {
    hideFullPath()
  } else {
    hoverForPath(e)
  }
});

document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e)
  } else {
    hideFullName()
  }
});

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  Object.keys(object).sort().forEach(function(key) {
  if (Array.isArray(object[key])) {
    orderedFiles[key] = object[key]
  } else {
      orderedFolders[key] = object[key];
  }
  });
  const orderedObject = {
    ...orderedFolders,
    ...orderedFiles
  }
  return orderedObject
}

function sliceStringByValue(string, endingValue) {
  var newString = string.slice(string.indexOf(endingValue) + 1)
  return newString
}

function listItems(jsonObj) {

        var appendString = ''
        var folderID = ''

        var sortedObj = sortObjByKeys(jsonObj)

        for (var item in sortedObj) {
          if (Array.isArray(sortedObj[item])) {
            // not the auto-generated manifest
            if (sortedObj[item].length !== 1) {
              var extension = sliceStringByValue(sortedObj[item][0],  ".")
              if (!["docx", "doc", "pdf", "txt", "jpg", "xlsx", "xls", "csv", "png"].includes(extension)) {
                extension = "other"
              }
            } else {
              extension = "other"
            }
            appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
          }
          else {
            folderID = item;
            var emptyFolder = "";
            if (! highLevelFolders.includes(item)) {
              if (JSON.stringify(sortedObj[item]) === '{}') {
                emptyFolder = " empty"
              }
            }
            appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()" id=' + folderID + '><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
          }
        }

        $('#items').empty()
        $('#items').html(appendString)
  }

function loadFileFolder(myPath) {
  var appendString = ""

  var sortedObj = sortObjByKeys(myPath)


  for (var item in sortedObj) {
    if (Array.isArray(sortedObj[item])) {
      // not the auto-generated manifest
      if (sortedObj[item].length !== 1) {
        var extension = sliceStringByValue(sortedObj[item][0],  ".")
        if (!["docx", "doc", "pdf", "txt", "jpg", "xlsx", "xls", "csv", "png"].includes(extension)) {
          extension = "other"
        }
      } else {
        extension = "other"
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
    }
    else {
      folderID = item;
      var emptyFolder = "";
      if (! highLevelFolders.includes(item)) {
        if (JSON.stringify(sortedObj[item]) === '{}') {
          emptyFolder = " empty"
        }
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()" id=' + folderID + '><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
    }
  }

  return appendString
}

function getRecursivePath(filteredList) {
  var myPath = jsonObjGlobal;
  for (var item of filteredList) {
    myPath = myPath[item]
  }
  return myPath
}

function getInFolder() {
  $('.single-item').dblclick(function(){

    if($(this).children("h1").hasClass("myFol")) {
      var folder = this.id
      var appendString = ''
      globalPath.value = globalPath.value + folder + "/"

      var currentPath = globalPath.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el != "";
      });

      var myPath = getRecursivePath(filtered)

      var appendString = loadFileFolder(myPath)

      $('#items').empty()
      $('#items').html(appendString)

      // reconstruct folders and files (child elements after emptying the Div)
      listItems(myPath)
      getInFolder()
      hideMenu("folder")
      hideMenu("high-level-folder")
    }
  })
}

/// check if an array contains another array
function checkSubArrayBool(parentArray, childArray) {
  var bool = true
  for (var element of childArray) {
    if (!parentArray.includes(element)) {
      bool = false
      break
    }
  }
  return bool
}

/// import progress
importProgress.addEventListener("click", function() {
  globalPath.value = "/"

  var filePath = dialog.showOpenDialogSync(null, {
    defaultPath: os.homedir(),
    filters: [
      {name: 'JSON', extensions: ['json']}
    ],
    properties: ['openFile']
  });

  if (filePath !== undefined) {
    var progressData = fs.readFileSync(filePath[0])
    var content = JSON.parse(progressData.toString())
    var contentKeys = Object.keys(content)
    if (checkSubArrayBool(contentKeys, highLevelFolders)) {
      jsonObjGlobal = content
    } else {
      bootbox.alert({
        message: "<p>Please import a valid file organization!</p>",
        centerVertical: true
      })
      return
    }

    var bootboxDialog = bootbox.dialog({
      message: '<p><i class="fa fa-spin fa-spinner"></i>Importing file organization...</p>'
    })
    bootboxDialog.init(function(){
      listItems(jsonObjGlobal)
      getInFolder()
      bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully loaded!");
    })
  }
})

// save progress
saveProgress.addEventListener("click", function() {
  var filePath = dialog.showSaveDialogSync(null, {
    defaultPath: os.homedir(),
    filters: [
      {name: 'JSON', extensions: ['json']}
    ]
  });
  if (filePath !== undefined) {
    fs.writeFileSync(filePath, JSON.stringify(jsonObjGlobal))
    bootbox.alert({
      message: "<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully saved file organization.",
      centerVertical: true
    })
  }
})


/// reset progress
resetProgress.addEventListener("click", function() {
  bootbox.confirm({
    title: "Clearing progress",
    message: "<p>Are you sure you want to clear the current file organization?</p>",
    centerVertical: true,
    callback: function(r) {
      if (r!==null) {
        globalPath.value = "/"
        jsonObjGlobal = {
          "code": {},
          "derivative": {},
          "primary": {},
          "source": {},
          "docs": {},
          "protocols": {}
        }
        listItems(jsonObjGlobal)
        getInFolder()
      }
    }
  })
})

function loadingDialog(text1, text2, func) {
  var bootboxDialog = bootbox.dialog({
    message: '<p><i class="fa fa-spin fa-spinner"></i> '+text1+'</p>',
  })
  bootboxDialog.init(function(){
    setTimeout(function(){
      func;
      bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>"+text2+"");
  }, 2000);
  })
}

/// if users choose to include manifest files
/// this function will first add manifest files to the UI
/// and update the JSON object with files "manifest": ["auto-generated manifest"]
/// TODO: not allow context menu for manifest files with value === array (lenght=1)
function updateManifestLabel(jsonObject) {
  /// first, add manifest files to UI
  var elements = Object.keys(jsonObject)
  for (var key of elements) {
      if (typeof jsonObject[key] === "object" && !(Array.isArray(jsonObject[key]))) {
        if (Object.keys(jsonObject[key]).length !== 0) {
          jsonObject[key]["manifest.xlsx"] = ["auto-generated"]
          /// if this folder is not empty, then recursively add manifest file
          updateManifestLabel(jsonObject[key])
        }
      }
    }
}

function myHelper() {
  listItems(jsonObjGlobal)
  getInFolder()
}


document.getElementById("generate-manifest").addEventListener("click", function() {

  globalPath.value = "/"

  if (document.getElementById("generate-manifest").checked) {

    var bootboxDialog = bootbox.dialog({
      // title: 'Adding manifest files',
      message: '<p><i class="fa fa-spin fa-spinner"></i>Adding manifest files...</p>'
    })
    bootboxDialog.init(function(){
      updateManifestLabel(copiedObject)
      bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully added!<br><br>Note: manifest files are not added to empty folders.");
    })
  }  else {
      var bootboxDialog = bootbox.dialog({
        message: '<p><i class="fa fa-spin fa-spinner"></i>Removing manifest files...</p>'
      })
      bootboxDialog.init(function(){
        myHelper()
        bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully removed!");
      })
    }
})
