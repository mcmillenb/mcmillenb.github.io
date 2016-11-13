var pressing = false;
var dragging = false;
var $icons   = $('.icon');
var $page    = $('#page');
$page.sortable({delay: 500});
$page.disableSelection();

function wiggleIcon($icon) {
  $({deg: 0}).animate({deg: 16}, {
    duration: 1200,
    step: function(now) {
      var deg;

      if (!dragging) { // when not dragging
        deg = 0; // set rotation to 0
      } else if (now > 12) { // at time 12
        deg = now - 16; // go from -4deg to 0deg
      } else if (now > 4) { // at time 4 
        deg = 4 - now; // go from 4deg to -4deg
      } else { // at time 0
        deg = now; // go from 0deg to 4deg
      }
      
      $icon.css({
        '-ms-transform': 'rotate(' + deg + 'deg)',
        '-moz-transform': 'rotate(' + deg + 'deg)',
        '-webkit-transform': 'rotate(' + deg + 'deg)',
        'transform': 'rotate(' + deg + 'deg)',
      });
    },
    ease: 'swing',
  });
};

function startDragging() {
  if (!pressing) {
    return;
  }
  dragging = true;
  $icons.each(function() {
    var $icon = $(this);               
    wiggleIcon($icon);
    var interval = window.setInterval(function() {
      if (dragging) {
        wiggleIcon($icon);
      } else {
        clearInterval(interval);
      }
    }, 1000);
  });
};

function stopDragging() {
  pressing = false;
  dragging = false;
};

var $body = $('body');
$icons.mousedown(function() {
  $icon = $(this);
  pressing = true;
  setTimeout(function() {
    startDragging();
  }, 500);
});

$icons.mouseup(stopDragging);

$icons.mouseleave(function() {
  if (!dragging) {
    pressing = false;
  }
});