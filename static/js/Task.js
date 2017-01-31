"use strict";

class TaskWrapper {
  constructor(){
    this.tasks = [];
    this.lastTaskId = 0;
  }
  addTask(task){
    task.id = `task${this.lastTaskId}`;
    this.tasks.push(task);
    this.lastTaskId += 1;
  }
  removeTask(task){
    this.tasks = this.tasks.filter( (t) => (t.id !== task.id) );
  }
  toHash(){
    if(this.tasks.length > 1){
      return this.tasks.reduce((a,b) => $.extend(a.toHash(), b.toHash()) );
    }else if(this.tasks.length === 1){
      return this.tasks[0].toHash();
    }else{
      return {};
    }
  }
}

class Task {
  constructor(name, id) {
    this.name = name;
    this.finished = false;
    this.id = id;
    this.parent = null;
    this.children = [];
    this.lastChildId = 0;
    this.comment = null;
  }
  done() {
    this.finished = true;
    this.parentDone();  // 再帰
    for(const c of this.children){
      c.childDone();  // 再帰
    }
  }
  // 親要素が完了したときに子要素がすべて完了にする
  childDone() {
    this.finished = true;
    for(const c of this.children){
      c.childDone();
    }
  }
  parentDone(){
    if(this.parent !== null){
      // 自分と同階層の子要素がすべて完了してた場合、親を完了にする
      if(this.parent.children.length == this.parent.countDoneChildren()){
        this.parent.finished = true;
        this.parent.parentDone();
      }
    }
  }
  undone() {
    this.finished = false;
    for(const c of this.children){
      c.childUndone();  // 再帰
    }
    this.parentUndone();  // 再帰
  }
  childUndone(){
    this.finished = false;
    for(const c of this.children){
      c.childUndone();
    }
  }
  parentUndone(){
    if(this.parent !== null){
      this.parent.finished = false;
      this.parent.parentUndone();
    }
  }
  addChildren(task) {
    task.id = `${this.id}-${this.lastChildId}`
    this.lastChildId += 1;
    this.children.push(task);
    task.parent = this;
    this.finished = task.finished;
  }
  removeChildren(task) {
    this.children = this.children.filter((c) => (c.id !== task.id) );
  }
  countDoneChildren() {
    return this.children.filter((c) => (c.finished)).length;
  }
  // 葉ノードまで潜って{id: this}に変換した結果を返す
  // まず、子要素を配列に格納して1個ずつ見て、孫要素があったら配列にappendしていく
  toHash(){
    const hash = {[this.id]: this};
    let children = this.children;
    while(children.length > 0) {
      const c = children[0];

      children = children.slice(1);
      hash[c.id] = c;

      if(c.children.length > 0){
        children = children.concat(c.children);
      }
    }
    return hash;
  }
}
