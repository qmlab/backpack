// Script to dynamically set the sidebar style

$(function(){ // document ready
  $('body').scrollspy({
    target: '.bs-docs-sidebar',
    offset: 40
  });

  $("#sidebar").affix({
    offset: {
      top: 200
    }
  });
});