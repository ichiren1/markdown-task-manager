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

function showNotification(content, addClass){
  $('#notification')
    .removeClass(function(index, className) {
      return (className.match(/\bis-\S+/g) || []).join(' ');
    })
    .addClass(addClass)
    .html(content)
    .fadeIn().delay(2000).fadeOut();
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
    window.localStorage.setItem(document.location.origin, toMarkdownFromTaskWrapper(taskWrapper));
    const markdown = window.localStorage.getItem(document.location.origin);
    if(toMarkdownFromTaskWrapper(taskWrapper) == markdown){
      showNotification('Save success!', 'is-success');
    }else{
      showNotification('Save failed...', 'is-danger');
    }

  });

  $('#load-from-browser').on('click', function(){
    const markdown = window.localStorage.getItem(document.location.origin);
    if(toMarkdownFromTaskWrapper(taskWrapper) == markdown){
      showNotification('Already lastest version.', 'is-info');
    }else{
      if( confirm('Do you want to overwrite?\n\nThere is a possibility that the current information will change') ){
        taskWrapper = toTaskFromMarkdown( markdown );
        taskHash = taskWrapper.toHash();
        constructionViewArea();
        for(const mainTask of taskWrapper.tasks){
          updateProgressValue(mainTask.id);
        }
        if(toMarkdownFromTaskWrapper(taskWrapper) == markdown){
          showNotification('Load success!', 'is-success');
        }else{
          showNotification('Load failed...\nPlease wait for a while and try again.', 'is-danger');
        }
      }
    }
  });
});
