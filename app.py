from typing import Tuple
from bmp280 import BMP280
from threading import Lock
from flask import Flask, render_template, session, request, jsonify, url_for
from flask_socketio import SocketIO, emit, disconnect
import MySQLdb       
import math
import time
import configparser as ConfigParser
import random

try:
    from smbus2 import SMBus
except ImportError:
    from smbus import SMBus

async_mode = None

app = Flask(__name__)


config = ConfigParser.ConfigParser()
config.read('config.cfg')
myhost = config.get('mysqlDB', 'host')
myuser = config.get('mysqlDB', 'user')
mypasswd = config.get('mysqlDB', 'passwd')
mydb = config.get('mysqlDB', 'db')
bus = SMBus(1)
bmp280 = BMP280(i2c_dev=bus)

print(myhost)


app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock() 

def get_sensor_data() -> Tuple[float, float]:
    temperature = round(bmp280.get_temperature(),2)
    pressure = round(bmp280.get_pressure(),2)
    return temperature, pressure

def background_thread(args):
    count = 0  
    dataCounter = 0 
    dataList = []  
    db = MySQLdb.connect(host=myhost,user=myuser,passwd=mypasswd,db=mydb)          
    while True:
        if args:
          A = dict(args).get('A')
          dbV = dict(args).get('db_value')
        else:
          A = 1
          dbV = 'nieco'  
        #print A
        #print dbV 
        print(args)  
        socketio.sleep(4)
        count += 1
        dataCounter +=1
        cas = time.time()
        temperature,pressure = get_sensor_data()
        if dbV == 'start':
          dataDict = {
            "t": cas,
            "x": temperature,
            "y": pressure,
          }
          dataList.append(dataDict)
          socketio.emit('my_response',
                      {'dataTemp': temperature, 'dataPres': pressure,'count': count},
                      namespace='/test') 
        else:
          if len(dataList)>0:
            print (str(dataList))
            datas = str(dataList).replace("'", "\"")
            print('----------------------')
            print(datas)
            count = 0
            cursor = db.cursor()
            cursor.execute("SELECT MAX(id) FROM SENSORDATA")
            maxid = cursor.fetchone()
            cursor.execute("INSERT INTO SENSORDATA (id, DATA) VALUES (%s, %s)", (maxid[0] + 1, datas))
            db.commit()
            fo=open("static/data.txt","a+")
            fo.write("%s\r\n"%datas)
            fo.close()
          dataList = []
          dataCounter = 0
         
    db.close()

@app.route('/')
def index():
    return render_template('index.html', async_mode=socketio.async_mode)

@app.route('/read/<string:num>', methods=['GET', 'POST'])
def readDataFile(num):
    fo=open("static/data.txt","r")
    rows=fo.readlines()
    return rows[int(num)-1]

@app.route('/graph', methods=['GET', 'POST'])
def graph():
    return render_template('graph.html', async_mode=socketio.async_mode)
    
@app.route('/db')
def db():
  db = MySQLdb.connect(host=myhost,user=myuser,passwd=mypasswd,db=mydb)
  cursor = db.cursor()
  cursor.execute("SELECT DATA FROM SENSORDATA")
  rv = cursor.fetchall()
  return str(rv)    

@app.route('/dbdata/<string:num>', methods=['GET', 'POST'])
def dbdata(num):
  db = MySQLdb.connect(host=myhost,user=myuser,passwd=mypasswd,db=mydb)
  cursor = db.cursor()
  print (num)
  cursor.execute("SELECT DATA FROM SENSORDATA WHERE id=%s", num)
  rv = cursor.fetchone()
  return str(rv[0])
    
# ~ @socketio.on('my_event', namespace='/test')
# ~ def test_message(message):   
    # ~ session['receive_count'] = session.get('receive_count', 0) + 1 
    # ~ session['A'] = message['value']    
    # ~ emit('my_response',
         # ~ {'data': message['value'], 'count': session['receive_count']})

@socketio.on('db_event', namespace='/test')
def db_message(message):   
    session['db_value'] = message['value']    
    print(session['db_value'])

@socketio.on('disconnect_request', namespace='/test')
def disconnect_request():
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']})
    disconnect()

@socketio.on('connect', namespace='/test')
def test_connect():
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(target=background_thread, args=session._get_current_object())
   # emit('my_response', {'data': 'Connected', 'count': 0})


@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected', request.sid)


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=80, debug=True)
