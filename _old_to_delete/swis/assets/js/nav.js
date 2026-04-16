document.addEventListener('DOMContentLoaded',function(){
  var burger=document.querySelector('.nav .burger');
  var links=document.querySelector('.nav .links');
  if(burger&&links){
    burger.addEventListener('click',function(){
      links.classList.toggle('open');
    });
  }
});
