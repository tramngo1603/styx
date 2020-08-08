var cmd = require('node-cmd');
let os = require('os')
var pathlib = require('path')
var fs = require('fs');

// var homedir = os.userInfo().homedir
var backFolder = []
var forwardFolder =[]
checkForFolderHistory()

var jsonObjGlobal = {
  "code": {
    'submission.xlsx': null,
    'empty-directory': {}
  },
  "derivatives": {},
  "primary": {},
  "source": {},
  "docs": {},
  "protocols": {},
  "submission.xlsx": null,
  "dataset_description.xlsx": null,
  "README.txt": null
}

loadpath(jsonObjGlobal)

function loadpath(jsonObj) {
  listItems(jsonObj);
}


function checkForFolderHistory() {
    if(backFolder.length === 0) {
        $('#back').prop('disabled', true)
    }
    if(forwardFolder.length === 0) {
        $('#forward').prop('disabled', true)
    }
}


function listItems(jsonObj) {
    // var reference = document.getElementById('iconView')
    // if(reference.classList.contains('active-btn')) {
        var appendString = ''
        for (var item in jsonObj) {
            if (!jsonObj[item]) {
              appendString = appendString + '<div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
            else {
              appendString = appendString + '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
        }
        $('#items').empty()
        $('#items').html(appendString)
            $('.single-item').dblclick(function(){
                if($(this).children("h1").hasClass("blue")) {
                    // $('#Home').removeClass('active_link')
                    // var referencer = $(this).children("div").text()
                    // if(referencer === 'Downloads') {
                    //     $('#Downloads').addClass('active_link');
                    // }
                    // if(referencer === 'Documents') {
                    //     $('#Documents').addClass('active_link');
                    // }
                    // if(referencer === 'Pictures') {
                    //     $('#Pictures').addClass('active_link');
                    // }
                    // if(referencer === 'Movies') {
                    //     $('#Movies').addClass('active_link');
                    // }
                    // var navigatorPath = pathlib.join(path, referencer)
                    loadpath(jsonObj[item])
                    // console.log(appendString)
                }
                // else {
                //     alert('Selection is not a directory. This software can currently open directories only.')
                // }
            })
            $('.folder_desc').dblclick(function(){
                if($(this).children("h1").hasClass("blue")) {
                    $('.folder_desc').attr('contenteditable','true');
                }
              })
    }
    // else {
    //     var appendString = ''
    //     for (var item in jsonObj) {
    //         if (!jsonObj[item]) {
    //           appendString = appendString + '<div class="single-item"><h1 class="folder file"><i class="fas fa-file"></i></h1><div class="folder_desc">'+item+'</div></div>'
    //         }
    //         else {
    //           appendString = appendString + '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
    //         }
    //     }
    //     $('#items').empty()
    //     $('#items').html(appendString)
    //     $('.listview').dblclick(function(){
    //         if($(this).children(".folder").hasClass("blue")) {
    //             // $('#Home').removeClass('active_link')
    //             // var referencer = $(this).children(".folder_desclist").text()
    //             // if(referencer === 'Downloads') {
    //             //     $('#Downloads').addClass('active_link');
    //             // }
    //             // if(referencer === 'Documents') {
    //             //     $('#Documents').addClass('active_link');
    //             // }
    //             // if(referencer === 'Pictures') {
    //             //     $('#Pictures').addClass('active_link');
    //             // }
    //             // if(referencer === 'Movies') {
    //             //     $('#Movies').addClass('active_link');
    //             // }
    //             // var navigatorPath = pathlib.join(path, referencer)
    //             loadpath(jsonObj)
    //         }
    //         else {
    //             alert('Selection is not a directory. This software can currently open directories only.')
    //         }
    //     })
    // }
    // $('#listView').click(function(){
    //     $('#iconView').removeClass('active-btn')
    //     $('#listView').addClass('active-btn')
    //     loadpath(jsonObj)
    // })
    // $('#iconView').click(function(){
    //     $('#listView').removeClass('active-btn')
    //     $('#iconView').addClass('active-btn')
    //     loadpath(jsonObj)
    // })
// }

// $(document).ready(function () {
//     $(".sidebar_links li").on('click', function(){
//         $(this).siblings().removeClass('active_link')
//         $(this).addClass('active_link');
//         var id = ($(this).attr('id'));
//
//         loadpath(jsonObj)
//     })
// });
