"use strict";

let taskHash = {};

let taskWrapper = new TaskWrapper();
const tasks = new Task("Main task sample");
taskWrapper.addTask(tasks);
const sub1 = new Task("Sub task1");
const sub2 = new Task("Sub task2");
sub2.comment = 'comment';
const subsub1 = new Task("Sub task2 sub task1");
const subsub2 = new Task("sub task2 sub task2");

tasks.addChildren(sub1);
tasks.addChildren(sub2);
tasks.children[1].addChildren(subsub1);
tasks.children[1].addChildren(subsub2);

taskHash = tasks.toHash();

let saveDataHash = {};
let nowSaveName = '';

function showNotification(content, addClass){
  $('#notification')
    .removeClass(function(index, className) {
      return (className.match(/\bis-\S+/g) || []).join(' ');
    })
    .addClass(addClass)
    .html(content)
    .fadeIn().delay(2000).fadeOut();
}

function loadSaveData(wrapper){
  let namesJson = window.localStorage.getItem(document.location.origin);
  if(namesJson){
    try {
      const names = JSON.parse(namesJson);
      if(names){
        let saveName = '';
        let updatedAt = '';
        let task = null;
        let nameJson = '';
        saveDataHash = {};
        $(wrapper).empty();

        let j = null;
        for(const n of names){
          nameJson = window.localStorage.getItem(`${document.location.origin}_${n}`);
          if(nameJson){
            j = JSON.parse(nameJson);
            saveName = j['saveName'];
            updatedAt = j['updatedAt'];
            task = toTaskFromMarkdown( j['task'] );
            saveDataHash[saveName] = task;
            let radio = $('<input>', { type: "radio", name: "save-name"});
            if(nowSaveName === saveName){
              $(radio).prop("checked", true);
            }

            $(wrapper).append(
              $('<div></div>', { "class": "save-name-content" }).append(
                $('<label>', { "class": "radio" }).append(
                  radio
                ).append(
                  $('<span></span>', { "class": "save-name", html: saveName})
                ).append(
                  $('<span></span>', { "class": "updated-at is-pulled-right", html:updatedAt })
                ).append(
                  $('<span></span>', {
                    "class": "icon",
                    id: saveName,
                    on: {
                      click: function(e){
                        delete saveDataHash[this.id];
                        window.localStorage.setItem( document.location.origin, JSON.stringify(Object.keys(saveDataHash)) );
                        window.localStorage.removeItem(`${document.location.origin}_${this.id}`);
                        $(e.target).closest('div').remove();
                      }
                    }
                  }).append(
                    $('<i>', { "class": "fa fa-times" })
                  )
                )
              )
            );
          }
        }
      }
    }catch (e) {
      const task = namesJson;
      const saveName = "Save data";
      const date = new Date();
      saveDataHash = {};
      $(wrapper).empty();
      const updatedAt = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      saveDataHash[saveName] = task;
      window.localStorage.setItem( `${document.location.origin}_${saveName}`, JSON.stringify({
        "saveName": saveName,
        "updatedAt": updatedAt,
        "task": saveDataHash[saveName] }) );
      window.localStorage.setItem( document.location.origin, JSON.stringify(Object.keys(saveDataHash)) );

      $(wrapper).append(
        $('<div></div>', { "class": "save-name-content" }).append(
          $('<label>', { "class": "radio" }).append(
            $('<input>', { type: "radio", name: "save-name"})
          ).append(
            $('<span></span>', { "class": "save-name", html: saveName})
          ).append(
            $('<span></span>', { "class": "updated-at is-pulled-right", html:updatedAt })
          ).append(
            $('<span></span>', {
              "class": "icon",
              id: saveName,
              on: {
                click: function(e){
                  delete saveDataHash[this.id];
                  window.localStorage.setItem( document.location.origin, JSON.stringify(Object.keys(saveDataHash)) );
                  window.localStorage.removeItem(`${document.location.origin}_${this.id}`);
                  $(e.target).closest('div').remove();
                }
              }
            }).append(
              $('<i>', { "class": "fa fa-times" })
            )
          )
        )
      );
    };
  }
}

$(function(){
  const editor = ace.edit('markdown-textarea');
  const MarkdownMode = ace.require('ace/mode/markdown').Mode;
  editor.setFontSize(16);
  editor.getSession().setMode(new MarkdownMode());
  editor.getSession().setTabSize(2);
  editor.$blockScrolling = Infinity;

  $('#nav-tabs-wrapper a').on('click', function(){
    if(!$(this).hasClass('is-active')){
      $(this).addClass('is-active').siblings('.nav-item').removeClass('is-active');
      switch (this.id){
        case 'markdown':
          const markdown = toMarkdownFromTaskWrapper( taskWrapper );
          editor.setValue(markdown);
          $("#markdown-view-area").addClass('active').siblings('.view-area').removeClass('active');
          break;
        case 'preview':
          taskWrapper = toTaskFromMarkdown( editor.getValue() );
          taskHash = taskWrapper.toHash();
          constructionViewArea();
          for(const mainTask of taskWrapper.tasks){
            updateProgressValue(mainTask.id);
          }
          $("#preview-view-area").addClass('active').siblings('.view-area').removeClass('active');
          break;
      }
    }
  })

  $('#save-to-browser').on('click', function(){
    $('.save-modal').addClass('is-active');
    loadSaveData('.saved-name-wrapper');
  });

  $('#load-from-browser').on('click', function(){
    $('.load-modal').addClass('is-active');
    loadSaveData('.loaded-name-wrapper');
  });

  $('.modal-background, .modal-cancel, .modal-close').on('click', function(e){
    $(e.target).closest('.modal').removeClass("is-active");
  });

  $('#new-save-name').focusin(function(e){
    $(e.target).prev().prop("checked", true);
  });

  $('#save-submit').on('click', function(e){
    let saveName = '';
    for(const i of $('.save-names-content').find('input[type=radio]')){
      if(i.checked){
        saveName = $(i).next().val() || $(i).next().html();
      }
    }
    const date = new Date();
    if(saveName === ''){
      saveName = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }
    if($('#preview').hasClass('is-active')){
      saveDataHash[saveName] = toMarkdownFromTaskWrapper(taskWrapper);
    }else if($('#markdown').hasClass('is-active')){
      saveDataHash[saveName] = editor.getValue();
    }

    window.localStorage.setItem( `${document.location.origin}_${saveName}`, JSON.stringify({
      "saveName": saveName,
      "updatedAt": `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
      "task": saveDataHash[saveName] }) );
    window.localStorage.setItem( document.location.origin, JSON.stringify(Object.keys(saveDataHash)) );

    nowSaveName = saveName;
    $('#new-save-name').val('');
    $('.save-modal').removeClass('is-active');
    showNotification(`"${saveName}" save success!`, 'is-success');window.localStorage.setItem( `${document.location.origin}_${saveName}`, JSON.stringify({
      "saveName": saveName,
      "updatedAt": `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
      "task": saveDataHash[saveName] }) );
    window.localStorage.setItem( document.location.origin, JSON.stringify(Object.keys(saveDataHash)) );
  });

  $('#load-submit').on('click', function(e){
    let saveName = '';
    for(const i of $('.load-names-content').find('input[type=radio]')){
      if(i.checked){
        saveName = $(i).next().html();
      }
    }
    taskWrapper = saveDataHash[saveName];
    taskHash = taskWrapper.toHash();
    constructionViewArea();
    for(const mainTask of taskWrapper.tasks){
      updateProgressValue(mainTask.id);
    }
    nowSaveName = saveName;

    $('.load-modal').removeClass('is-active');
    showNotification(`"${saveName}" load success!`, 'is-success');
  });
});
