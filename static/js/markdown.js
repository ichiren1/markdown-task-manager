"use strict";

function toTaskFromMarkdown(markdown){
  const regex = / *- (.+)/g;
  const tasks = markdown.match(regex);
  let parents = {};
  const contentRegex = / *- \[( |x)\] ?(.+)/;
  const taskWrapper = new TaskWrapper();
  let lastAppendTask = null;
  let base = 0;
  if(tasks){
    for(const t of tasks){
      if(/ *- \[( |x)\] (.+)?/.test(t)){  // task
        const spaceNum = t.split('-')[0].length;
        const [origin, finished, content] = t.match(contentRegex);
        const task = new Task(content);
        task.finished = finished === 'x';
        if(Object.keys(parents).length === 0 || base > spaceNum){
          base = spaceNum;
          parents = {}
        }
        if(spaceNum === base){
          taskWrapper.addTask(task);
        }else{
          for(let i=spaceNum-1; i>=0; i--){
            if(parents.hasOwnProperty(i)){
              parents[i].addChildren(task);
              break;
            }
          }
        }
        parents[spaceNum] = task;
        lastAppendTask = task;
      }else{  // comment
        const [origin, comment] = t.match(/- (.+)/);
        if(lastAppendTask.comment){
          lastAppendTask.comment += '\n'+comment;
        }else{
          lastAppendTask.comment = comment;
        }
      }
    }
  }
  return taskWrapper;
}
