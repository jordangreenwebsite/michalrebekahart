(function(){
 document.addEventListener('pointerdown',function(event){
   document.querySelectorAll('[data-mra-header]').forEach(function(header){
     var clicked=event.target.closest('summary');
     var current=clicked&&clicked.closest('details');
     if(!header.contains(event.target)){
       header.querySelectorAll('details[open]').forEach(function(el){el.open=false;});
     }else if(current){
       header.querySelectorAll('details[open]').forEach(function(el){
         if(el!==current&&!el.contains(current))el.open=false;
       });
     }
   });
 });
 document.addEventListener('keydown',function(event){
   if(event.key==='Escape'){
     document.querySelectorAll('[data-mra-header] details[open]').forEach(function(el){el.open=false;});
   }
 });
})();