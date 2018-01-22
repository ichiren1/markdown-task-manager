"use strict";

function toMarkdownFromTaskWrapper(tw){
  let markdown = '';
  for(const t of tw.tasks){
    markdown = toMarkdownFromTask('', markdown, t)+'\n';
  }
  return markdown;
}

function toMarkdownFromTask(space, markdown, task){
  const bracket = task.finished ? '[x]' : '[ ]';
  markdown += `${space}- ${bracket} ${task.name}\n`
  if(task.comment){
    for(const c of task.comment.split(/\r\n|\r|\n/)){
      markdown += `${space}- ${c}\n`
    }
  }
  for(const c of task.children){
    markdown = toMarkdownFromTask(space+' ', markdown, c);
  }
  return markdown;
}

// 引数の親要素のidを取得する
function getParentTaskId(id){
  return id.split('-').slice(0, -1).join('-');
}

function isMainTask(id){
  return getAncestorId(id) === id;
}

// ルートのIDを返す
function getAncestorId(id){
  return id.split('-')[0];
}

function getTaskProgress(id){
  const progress = $(`#${id} progress`)[0];
  return progress === undefined ? null : progress;
}

function getTaskCheckbox(id){
  return $(`#${id} input[type=checkbox]`)[0];
}

function updateDoneTasks(t){
  getTaskCheckbox(t.id).checked = t.finished;
  for(const c of t.children){
    updateDoneTasks(c);
  }
}

function updateProgressValue(id){
  const thisTask = taskHash[id];
  const progress = getTaskProgress(thisTask.id);
  if(progress !== null){
    progress.value = thisTask.countDoneChildren();
    progress.max = thisTask.children.length;
    if(thisTask.children.length === 0){
      if(isMainTask(id)){
        progress.value = thisTask.finished ? 1 : 0;
      }else{
        progress.remove();
      }
    }
  }

  for(const c of thisTask.children){
    updateProgressValue(c.id);
  }
}

function insertEdits(size){
  return (
    $('<span></span>', { 'class': 'edits', id: size }).append(
      $('<span></span>', {
        "class": "icon",
        title: "add sub task",
        on: {
          click: function(e){
            const parentTask = e.target.closest('.sub-task');
            if(parentTask){
              addSubTask(parentTask.id, '');
            }else{  // 親のサブタスクがない場合（メインタスクのとき）
              addSubTask(e.target.closest('.main-task').id, '');
            }
          }
        }
      }).append($('<i>', { "class": "fa fa-level-down" }))
    ).append(
      $('<span></span>', {
        "class": "icon",
        title: "add comment",
        on: {
          click: function(e){
            const parentTask = e.target.closest('.sub-task');
            if(parentTask){
              addComment(parentTask.id);
            }else{  // 親のサブタスクがない場合（メインタスクのとき）
              addComment(e.target.closest('.main-task').id);
            }
          }
        }
      }).append($('<i>', { "class": "fa fa-commenting-o" }))
    ).append(
      $('<span></span>', {
        "class": "icon",
        title: "remove sub task",
        on: {
          click: function(e){
            const parentTask = e.target.closest('.sub-task');
            if(parentTask){
              removeSubTask(parentTask.id);
            }else{  // 親のサブタスクがない場合（メインタスクのとき）
              removeSubTask(e.target.closest('.main-task').id);
            }
          }
        }
      }).append($('<i>', { "class": "fa fa-times" }))
    )
  );
}

function addCheckHandle(e){
  let id = '';
  if(e.target.closest('.sub-task')){
    id = e.target.closest('.sub-task').id
  }else{  // メインタスクのとき
    id = e.target.closest('.main-task').id;
  }
  let ancestorId = getAncestorId(id);
  const thisTask = taskHash[id];
  if( e.target.checked ){
    thisTask.done();
  }else{
    thisTask.undone();
  }
  updateDoneTasks(taskHash[ancestorId]);
  updateProgressValue(ancestorId);
}

function addChangeHandle(e){
  let id = '';
  if(e.target.closest('.sub-task')){
    id = e.target.closest('.sub-task').id
  }else{  // メインタスクのとき
    id = e.target.closest('.main-task').id;
  }
  if(e.shiftKey && e.keyCode === 13 || (e.ctrlKey && e.keyCode == 40) ){  // Enter & ↓
    let newId = '';
    if(isMainTask(id)){
      newId = addParentTask();
    }else{
      newId = addSubTask(getParentTaskId(id), '');
    }
    $(`#${newId} .task-name`).focus();
  }else if(e.ctrlKey && e.keyCode == 39){  // →
    let newId = addSubTask(id, '');
    $(`#${newId} .task-name`).focus();
  }else{
    taskHash[id].name = e.target.value;
  }
}

function removeSubTaskFromHash(task){
  for(const c of task.children){
    removeSubTaskFromHash(c);
}
  delete taskHash[task.id];
}

function removeSubTask(id){
  if(isMainTask(id)){
    const thisTask = taskHash[id];
    taskWrapper.removeTask(thisTask);
    removeSubTaskFromHash(thisTask);
    $(`#${thisTask.id}`).closest('.card').remove();
  }else{
    const parentTask = taskHash[getParentTaskId(id)];
    const subTask = taskHash[id];
    parentTask.removeChildren(subTask);  // 子要素の削除
    removeSubTaskFromHash(subTask)  // 再帰的に辞書へ反映
    $(`#${subTask.id}`).remove();
    updateProgressValue(getAncestorId(id));
  }
}

function addSubTask(id, content){
  const parentTask = taskHash[id];
  const subTask = new Task(content);
  parentTask.addChildren(subTask);  // 子要素の追加
  taskHash[subTask.id] = subTask;  // 辞書へ反映
  if(!$(`#${id} .sub-task-wrapper`)[0]){  // サブタスクがないとき
    $(`#${id}`).append($('<div></div>', { 'class': 'sub-task-wrapper'}));
    $(`#${id} .progress-wrapper`).append($('<progress />', {
      'class': 'progress is-small is-primary',
      value: '0',
      max: '0'
    }));
  }
  const subTaskWrapper = $($(`#${id} .sub-task-wrapper`)[0]);
  subTaskWrapper.append(
    $('<div></div>', {
      'class': 'sub-task',
      id: subTask.id
    }).append(
      $('<div></div>', {'class': 'progress-wrapper'})
        .append($('<input />', {
            type: 'checkbox',
            tabindex: -1,
            on: {
              change: function(e){
                addCheckHandle(e);
              }
            }
        }))
        .append($('<input />', {
          'class': 'task-name',
          placeholder: 'Task name',
          value: subTask.name,
          on: {
            keyup: function(e){
              addChangeHandle(e);
            }
          }
        }))
        .append( insertEdits('is-small') )
    )
  );
  getTaskProgress(parentTask.id).max = parentTask.children.length;  // 親のプログレスバーのmaxを変更
  updateDoneTasks(taskHash[getAncestorId(id)]);
  return subTask.id;  // 生成したサブタスクのIDを返す
}

function addParentTask(){
  const newTask = new Task('');
  taskWrapper.addTask(newTask);
  taskHash[newTask.id] = newTask;
  $('#preview-view-area').append(constructionCardFromTask(newTask));
  return newTask.id;  // 生成したメインタスクのIDを返す
}

function addComment(id){
  let commentWrapper = $(`#${id}`).children('.comment-wrapper')[0];
  if(isMainTask(id)){
   commentWrapper = $(`#${id}.sub-task`).children('.comment-wrapper')[0];
  }
  if(commentWrapper){
    alert(`already exists ${taskHash[id].name} comment`);
  }else{
    $($(`#${id} .progress-wrapper`)[0]).after(
      $('<div></div>', { "class": "comment-wrapper"}).append(
        $('<textarea></textarea', {
          "class": "textarea",
          placeholder: 'Comment',
          html: taskHash[id].comment,
          on: {
            input: function(e){
              taskHash[id].comment = e.target.value;
            }
          }
        })
      ).append(
        $('<span></span', {
          "class": "icon remove-comment",
          on: {
            click: function(e){
              e.target.closest('.comment-wrapper').remove();
              taskHash[id].comment = null;
            }
          }
        }).append($('<i>', { "class": "fa fa-times"}))
      )
    )
    if(!taskHash[id].comment){
      taskHash[id].comment = '';
    }
  }
}

function constructionViewArea(){
  $('#preview-view-area').html(
    $('<a></a>', {
      "class": "button",
      html: "Add Parent Task",
      on: {
        click: function(e){
          addParentTask();
        }
      }
    })
  );
  for(const task of taskWrapper.tasks){
    $('#preview-view-area').append(constructionCardFromTask(task));
  }
  for(const key of Object.keys(taskHash)){
    if(taskHash[key].comment){
      addComment(key);
    }
  }
}

// 子要素を構築 孫要素がある場合は再帰的に呼び出す
function constructionCardChildrenTask(children){
  const childrenElements = children.map(function(c){
    const div = $('<div></div>', { "class": "sub-task", id: c.id}).append(
      $('<div></div>', { "class": "progress-wrapper" })
        .append( $('<input />', {
          type: "checkbox",
          tabindex: -1,
          checked: c.finished,
          on: {
            change: function(e){
              addCheckHandle(e);
            }
          }
        }))
        .append( $('<input />', {
          "class": "task-name",
          placeholder: 'Task name',
          value: c.name,
          on: {
            keyup: function(e){
              addChangeHandle(e);
            }
          }
        }) )
        .append( insertEdits('is-small') )
    );
    if(c.children.length > 0){
      div.children('.progress-wrapper').append(
        $('<progress />', { "class": "progress is-small is-primary", value: "0", max: c.children.length})
      );
      return div.append(constructionCardChildrenTask(c.children));
    }else{
      return div;
    }
  });
  return (
    $('<div></div>', { "class": "sub-task-wrapper"}).append(
      childrenElements
    )
  );
}

// TaskクラスからDOM要素を構成 中でconstructionCardChildrenTaskを呼び出す
function constructionCardFromTask(task){
  return (
    $('<div></div>', { "class": "card is-fluid" }).append(
      $('<header></header>', { "class": "card-header" }).append(
        $('<div></div>', { "class": "card-header-title" }).append(
          $('<div></div>', { "class": "main-task progress-wrapper", id: task.id})
          .append($('<input />', {
            type: "checkbox",
            tabindex: -1,
            checked: task.finished,
            on: {
              change: function(e){
                addCheckHandle(e);
              }
            }
          }))
          .append($('<input />', {
            "class": "task-name",
            placeholder: 'Task name',
            value: task.name,
            on: {
              keyup: function(e){
                addChangeHandle(e);
              }
            }
          }))
          .append( insertEdits() )
          .append($('<progress />', { "class": "progress is-small is-primary", value: "0", max: task.children.length}))
        )
      )
    ).append(
      $('<div></div>', { "class": "card-content"}).append(
        $('<div></div>', { "class": "sub-task", id: task.id })
        .append( $('<div></div>', { "class": "progress-wrapper" }) )
        .append(
            constructionCardChildrenTask(task.children)
        )
      )
    )
  );
}

$(function(){
  constructionViewArea();
});
