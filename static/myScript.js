$(function () {
    $("#tabs").tabs({
        event: "mouseover"
    });
});

//---------------- MAIN --------------------------------
$(document).ready(function () {
    namespace = '/test';
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
    socket.on('connect', function () {
        socket.emit('my_event', { data: 'I\'m connected!', value: 1 });
    });

    socket.on('my_response', function (msg) {
        if(msg.count > -1 ){
        $('#log').append('Received #' + msg.count + ': ' + msg.dataTemp + 'C ' + msg.dataPres +'hPa' +'<br>').html();
    }else{
        $('#log').append(msg.data).html();
        }
    });

    $('#buttonVal').click(function (event) {
        socket.emit('db_event', { value: $('#buttonVal').val() 
        });
        if ($(this).val() == "start") {
            $(this).val("stop");
            $(this).text("Stop");
        }
        else {
            $(this).val("start");
            $(this).text("Start");
        }
        return false;
    });
  
   $('#limitSet').click(function (event) {
       var limit = document.getElementById("valueLim").value;
       console.log(limit);
       if(limit == null){
           limit = -100;
        }
        socket.emit('limit_event', { value: limit });
    });
    
    $('form#disconnect').submit(function (event) {
        var dataDiv = document.getElementById("designData");
        var buttonDiv = document.getElementById("welcomeParent");
        var buttonWelcome = document.getElementById("startButton");
        dataDiv.style.display = "none";
        buttonDiv.style.display = "block";
        buttonWelcome.style.display = "none";
        document.body.style.backgroundColor="black";
        buttonDiv.style.backgroundColor="black";
        socket.emit('disconnect_request');
        return false;
    });
    
    $('#plotdivTemp').css('display','block');
    $('#plotdivPress').css('display','none');

});
//-------------- BODY -----------------------------------------------------
let ind = 1;



function showBody() {
    var dataDiv = document.getElementById("designData");
    var buttonDiv = document.getElementById("welcomeParent");
    dataDiv.style.display = "block";
    buttonDiv.style.display = "none";
}

function showTempGraf(){
    var plotTemp = document.getElementById("plotdivTemp");
    var plotPres = document.getElementById("plotdivPress");
    plotTemp.style.display="block";
    plotPres.style.display="none";
    }
    
function showPressGraf(){
    var plotTemp = document.getElementById("plotdivTemp");
    var plotPres = document.getElementById("plotdivPress");
    plotTemp.style.display="none";
    plotPres.style.display="block";
    }

//-------------- GRAFY----------------------------------
$(document).ready(function () {
    var x = new Array();
    var y = new Array();
    var y2 = new Array();
    var trace;
    var layout;

    namespace = '/test';
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

    socket.on('connect', function () {
        socket.emit('my_event', { data: 'I\'m connected!', value: 1 });
    });

    socket.on('my_response', function (msg) {
        x.push(parseFloat(msg.count));
        y.push(parseFloat(msg.dataTemp));
        y2.push(parseFloat(msg.dataPres));
        trace = {
            x: x,
            y: y,
            name: 'Temp'
        };
        trace2 = {
            x: x,
            y: y2,
            name: 'Press'
        };
        layout = {
            title: 'Teplota',
            xaxis: {
                title: 'x',
            },
            yaxis: {
                title: 'y',
                //range: [-1,1]
            }
        };
        //console.log(trace);
        var traces = new Array();
        traces.push(trace);
        Plotly.newPlot($('#plotdivTemp')[0], traces, layout);
        //addTraces               
    });
    
    socket.on('my_response', function (msg) {
        x.push(parseFloat(msg.count));
        y.push(parseFloat(msg.dataTemp));
        y2.push(parseFloat(msg.dataPres));
        trace = {
            x: x,
            y: y,
            name: 'Temp'
        };
        trace2 = {
            x: x,
            y: y2,
            name: 'Press'
        };
        layout = {
            title: 'Tlak',
            xaxis: {
                title: 'x',
            },
            yaxis: {
                title: 'y',
                //range: [-1,1]
            }
        };
        //console.log(trace);
        var traces = new Array();
        traces.push(trace2);
        Plotly.newPlot($('#plotdivPress')[0], traces, layout);
        //addTraces          
             
    });
   

    $('form#emit').submit(function (event) {
        socket.emit('my_event', { value: $('#emit_value').val() });
        return false;
    });
    $('#buttonVal').click(function (event) {
        //console.log($('#buttonVal').val());
        socket.emit('click_event', { value: $('#buttonVal').val() });
        return false;
    });

});

//----------------------CIFERNIK--------------------------------
//https://canvas-gauges.com/documentation/user-guide/configuration
$(document).ready(function () {
    var gauge = new RadialGauge({
        renderTo: 'canvasID',
        width: 300,
        height: 300,
        units: "Celsius",
        minValue: -50,
        maxValue: 50,
        majorTicks: [
            "-50",
            "-40",
            "-30",
            "-20",
            "-10",
            "0",
            "10",
            "20",
            "30",
            "40",
            "50"
        ],
        minorTicks: 2,
        strokeTicks: true,
        highlights: [
            {
                "from": -50,
                "to": -40,
                "color": "rgba(200, 50, 50, .75)"
            },
            {
                "from": 40,
                "to": 50,
                "color": "rgba(200, 50, 50, .75)"
            }
        ],
        colorPlate: "#fff",
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear"
    });
    gauge.draw();
    gauge.value = "0";

    namespace = '/test';
      var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

      socket.on('connect', function() {
        socket.emit('my_event', {data: 'I\'m connected!', value: 1}); });

      socket.on('my_response', function(msg) {
                
        gauge.value = msg.dataTemp;                
        });

      $('form#emit').submit(function(event) {
          socket.emit('my_event', {value: $('#emit_value').val()});
          return false; });
      $('#buttonVal').click(function(event) {
          //console.log($('#buttonVal').val());
          socket.emit('click_event', {value: $('#buttonVal').val()});
          return false; 
          });

});


