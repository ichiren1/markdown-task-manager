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
});
