// whether or not the mouse is down on an icon
var _pressing  = false;
// whether or not an icon is in the process of being moved
var _dragging  = false;
// timeout to delay the drag effect
var _pressTimeout;

// the app icon elements
var $icons = $('.icon');
// the element containing the app icons
var $page  = $('#page');

// make the app icons sortable
$page.sortable({ 
  containment: 'parent',
  stop: function(e, ui) { 
    _pressing = false;
    $(this).sortable('disable');
  }
}).sortable('disable'); // disable initially

/**
 * Animate an icon element to wiggle rotationally
 * @param  {object} $icon App icon element to apply animation to
 * @return {void}
 */
function wiggleIcon($icon) {
  var $dummy = $({ deg: 0 }); // dummy object with 'deg' property 
  $dummy.animate({ deg: 16 }, { // animate 16 steps
    duration: 1200,
    step: function(now) { 
      var deg; // the degree of rotation to animate the icon to
      if (!_dragging) { // when not dragging
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

/**
 * Initiate the icon dragging effect
 * @return {void} 
 */
function startDragging() {
  if (!_pressing) { // dragging can only happen when pressing
    return;
  }
  _dragging = true;
  $icons.each(function() { // wiggle all of the icons when dragging one
    var $icon = $(this);               
    wiggleIcon($icon);
    var interval = window.setInterval(function() {
      if (_dragging) { 
        wiggleIcon($icon); 
      } else {
        clearInterval(interval);
      }
    }, 1000);
  });
};

/** EVENT LISTENERS **/

// when the mouse goes down on an icon
$icons.on('mousedown touchstart', function(e) { 
  e.preventDefault();
  if (_dragging) {
    return;
  }
  var $this = $(this);
  var event = e;
  _pressing = true;
  _pressTimeout = setTimeout(function() { // start dragging after half a second
    $page.sortable('enable'); // enable the sort (and drag) effects on icons
    startDragging();
    $this.trigger(event);
  }, 500); 
}).on('mousemove touchmove', function() { // when the mouse moves on an icon
  clearTimeout(_pressTimeout);
  _pressing = false; // then the state is set to not pressing
});

// when the mouse goes up anywhere in the body
$('body').on('mouseup touchend', function() { 
  clearTimeout(_pressTimeout);
  _pressing = false; // the state is set to not pressing
  _dragging = false; // and not dragging
});
