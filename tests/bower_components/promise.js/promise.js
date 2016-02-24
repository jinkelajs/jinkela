var Promise;
void function(){
  if(Promise)return;
  var global=Function("return this")();
  var nextTick=global.setImmediate||global.setTimeout;
  //Interal "promise" object strage structure.
  var PromiseStorage=function(){
    this.onResolve=[];
    this.onReject=[];
    this.value=void 0;
    this.status=0;
  };
  //To build an action for a function with a pair of resolve/reject.
  //The action is use to try process a value with that function, and
  //catch the result to resolve/reject, and it's run in next tick.
  var buildAction=function(action,resolve,reject){
    return function(value){
      nextTick(function(){
        try{
          resolve(typeof action=="function"?action(value):value);
        }catch(e){ reject(e); };
      });
    };
  };
  //Interfact of "Promise" constructor.
  Promise=function(resolver){
    if(typeof resolver!="function")
      throw new TypeError("Promise resolver is not a function");
    //Initialize the storage area.
    var storage=new PromiseStorage;
    //Try to execute the resolver.
    try{ resolver(resolve,reject); }
    catch(e){ reject(e); };
    //To exports the internal storage object.
    var toString=this.toString=function(){
      //We can get storage object from PromiseThen function.
      if(toString.caller==PromiseThen)return storage;
      //Return a string in common calling case.
      return "[object Promise]";
    };
    //Callback interface of resolver.
    function resolve(value){
      if(storage.status)return;
      //Status=1 is means current instance is resolving, but the value
      //is not resulted yet.
      //Now, any callbacks that passing from then/catch methods are
      //still queued. But other resolve/reject calling will be ignore
      //from now on.
      storage.status=1;
      //Unpack the value until it's not a Promise instance or reject.
      if(value&&value.then&&value["catch"])
        value.then(function(value){
          storage.status=0,resolve(value);
        },function(value){
          storage.status=0,reject(value);
        });
      //Call all onResolve callbacks with result value that.
      else complete(storage.onResolve,value);
    };
    //Callback interface of resolver.
    function reject(value){
      if(storage.status)return;
      //Status=-1 is means current instance is rejecting.
      storage.status=-1;
      //Call all onResolve callbacks with result value that.
      complete(storage.onReject,value);
    };
    //Is called when the instance resolve/reject.
    function complete(s,value){
      storage.value=value;
      //abs(status)=2 means current instance is working completed, 
      //the value is resulted.
      //status=+2 means it's resolved.
      //status=-2 means it's rejected.
      storage.status*=2;
      //Call and free the callbacks queue;
      for(var i=0;i<s.length;i++)s[i](value);
      delete storage.onResolve;
      delete storage.onReject;
    };
  };
  //Interface function of "Promise.prototye.then".
  var PromiseThen=Promise.prototype.then=function(onresolve,onreject){
    var storage=this.toString();
    if(!storage)throw new Error;
    //Return a new Promise object.
    return new Promise(function(resolve,reject){
      //Build the actions.
      var res=buildAction(onresolve,resolve,reject);
      var rej=buildAction(onreject,resolve,reject);
      switch(storage.status){
        //If that Promise object is resolved, try to process it's value
        //with "onresolve" callback, and catch the process result with 
        //the resolve/reject of current Promise object.
        case +2:return res(storage.value);
        //As in the able cast, but here use "onreject" action, and here
        //is a case that Promise object rejected.
        case -2:return rej(storage.value);
        //Other case that no value resulted in that Promise object,
        //queue the actions to interal array.
        default:
          storage.onResolve.push(res);
          storage.onReject.push(rej);
      };
    });
  };
  //Interface function of "Promise.prototye.catch".
  var PromiseCatch=Promise.prototype["catch"]=function(onreject){
    return PromiseThen.call(this,null,onreject);
  };
  //Interface static method of "Promise.reject".
  Promise.reject=function(value){
    return new Promise(function(resolve,reject){
      reject(value);
    });
  };
  //Interface static method of "Promise.reject".
  Promise.resolve=function(value){
    return new Promise(function(resolve,reject){
      resolve(value);
    });
  };
  //Interface static method of "Promise.all".
  Promise.all=function(arr){
    return new Promise(function(resolve,reject){
      if(!(arr instanceof Array))throw "need an array";
      var results=[],count=arr.length,i;
      if(count==0)resolve(results);
      for(i=0;i<arr.length;i++)(function(i){
        Promise.resolve(arr[i]).then(function(e){
          results[i]=e,--count||resolve(results);
        },reject);
      })(i);
    });
  };
  //Interface static method of "Promise.race".
  Promise.race=function(arr){
    return new Promise(function(resolve,reject){
      if(!(arr instanceof Array))throw "need an array";
      for(var i=0;i<arr.length;i++)
        Promise.resolve(arr[i]).then(resolve,reject);
    });
  };
  return Promise;
}();

if(window.define&&define.amd)define(function(){ return Promise; });

