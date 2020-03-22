process.env["NTBA_FIX_319"] = 1;
const config = require('./config.json'),
      menu = require('./menu.json'),
      TelegramBot = require('node-telegram-bot-api'),
      _ = require('lodash'),
      db = require('diskdb');
// MyClassroomsBot
// Author: Rodrigo Martins Fernandes (@ProfRod at telegram)

// Instantiate Telegram Bot
const bot = new TelegramBot(config.token, {polling: true});
const apiurl = "";
const helpkeyboard = {"reply_markup": {"keyboard": [["/help"],["/myclassrooms","/ref"]],"one_time_keyboard":true}};
const teacherhelpkeyboard = {"reply_markup": {"keyboard": [["/help"],["/myclassrooms"],["/approve"],["/addref","/ref"]],"one_time_keyboard":true}};
const algorithm = 'aes256';
var upload_files_session = [];
var menu_session = [];
const WINKING_FACE = '\u{0001F609}';
const MEMO = '\u{0001F4DD}';
const FAIL = '\u{0001F44E}';
const WEARY = '\u{0001F629}';
const OCT = '\u{0001F6D1}';
const PROHIBITED = '\u{0001F6AB}';
const GRADCAP = '\u{0001F393}';
const SCHOOL = '\u{0001F3EB}';

// Schedule to run every 30 seconds
setInterval(session_timeout_countdown, 30000);


// Connect to diskdb
db.connect('./data', ['adminusers','teacherusers','studentusers','classrooms','references']);

// helper functions
function isAdmin(username)
{
  var isAdmin = db.adminusers.find({username:username});
  if(isAdmin.length) return true;

  return false;
}

function isStudentUser(username)
{
  var isStudentUser = db.studentusers.find({username:username});
  if(isStudentUser.length) return true;

  if(isteacherUser(username)) return true; else return isAdmin(username);
}

function isteacherUser(username)
{
  var isteacherUser = db.teacherusers.find({username:username});
  if( isteacherUser.length ) return true;

  return isAdmin(username);
}

function getAdminUsernames()
{
  var admins = db.adminusers.find();
  var usernames = [];

  admins.forEach(function(admin){
    usernames.push("@"+admin.username);
  });

  return usernames.join(" OR ");
}

// Start
bot.onText(/\/start$/, (msg) => {

    var adminUsers = getAdminUsernames();
    var reply = "Welcome to MyClassroomsBot! Thank you for your interest. Please, contact "+adminUsers+" if you wish to have access to MyClassroomsBot. If you already have access, type /help to see a list of available commands.";
    
    if( isteacherUser(msg.from.username) )
      bot.sendMessage(msg.chat.id, reply, teacherhelpkeyboard);
    else
      bot.sendMessage(msg.chat.id, reply, helpkeyboard);
});

// Help
bot.onText(/\/help$/, (msg) => {

    console.log('[' + new Date().toString() + '] Command /help from username:@' + msg.from.username);
    var reply = "";

    if( isStudentUser(msg.from.username) )
    {
        reply = "Available Commands:\n";
        reply = reply + "/myclassrooms - List of all your classrooms\n";
        reply = reply + "/join classroom_id - Join a classroom\n";
        reply = reply + "/exit classroom_id - Exit a classroom\n";
        reply = reply + "/ref - Get All references from a classroom\n";

        if( isteacherUser(msg.from.username) )
        {
            reply = reply + "\nTeacher Commands:\n";
            reply = reply + "/new classroom_id - Create new classroom. classroom_id is an unique id for your classroom (without space)\n";
            reply = reply + "/approve - Approve student joining in the classroom\n";
            reply = reply + "/addstd <classroom name> <student username> - Add a Student\n";
            reply = reply + "/delstd <classroom name> <student username> - Remove a student from the classroom\n";
            reply = reply + "/addclass <classroom name> <yyyy-mm-dd> <\"class name\"> <\"class subject\"> - Add a class in classromm>\n";
            reply = reply + "/delclass <class name> <class date yyyy-mm-dd> <\"class subject\"> - Remove a class in classromm>\n";
        }
        if( isAdmin(msg.from.username) )
        {
            reply = reply + "\nAdmin Commands:\n";
            reply = reply + "/admins - List of admin users\n";
            reply = reply + "/addadmin <username> - Add user as admin\n";
            reply = reply + "/deladmin <username> - Remove an admin user\n";
            reply = reply + "/teachers - List of teacher users\n";
            reply = reply + "/addteacher <username> - Add username as teacher user\n";
            reply = reply + "/delteacher <username> - Remove username as teacher user\n";
            reply = reply + "/students - List of students users\n";
        }
    }
    else
    {
        var adminUsers = getAdminUsernames();
        reply = "Welcome to MyClassroomsBot! Thank you for your interest. Please contact "+adminUsers+" if you wish to have access to this bot";
    }

    bot.sendMessage(msg.chat.id, reply);
});

/* Start of Admin Commands */

// List all Teacher users
bot.onText(/\/teachers$/, (msg) => {

    console.log('[' + new Date().toString() + '] Command /teachers from username:@' + msg.from.username);
    var reply = "Invalid Command. Type /help for more info.";
    if( isAdmin(msg.from.username) )
    {
        var users = db.teacherusers.find();

        reply = "Teachers Users:\n";

        if( users.length )
        {
            users.forEach(function(user){
                reply = reply + user.username + "\n";
            });
        }
        else
        {
            reply = reply + "<None>";
        }
    }

    bot.sendMessage(msg.chat.id, reply);
});


// Add a Teacher user
bot.onText(/\/addteacher ([^\s\\]+)$/, (msg, match) => {

    console.log('[' + new Date().toString() + '] Command /addteacher ' + match[1] + ' from username:@' + msg.from.username);
    var reply = "Invalid Command. Type /help for more info.";
    if( isAdmin(msg.from.username) )
    {
        var user = {username: match[1]};
        db.teacherusers.save(user);

        reply = match[1] + " successfully added";
    }

    bot.sendMessage(msg.chat.id, reply);
});


// Delete a Teacher user
bot.onText(/\/delteacher ([^\s\\]+)$/, (msg, match) => {

    console.log('[' + new Date().toString() + '] Command /delteacher ' + match[1] + ' from username:@' + msg.from.username);
    var reply = "Invalid Command. Type /help for more info.";
    if( isAdmin(msg.from.username) )
    {
        var query = {
            username: match[1]
        }

        var premiumUser = db.teacherusers.find(query);

        if( premiumUser.length )
        {
            db.teacherusers.remove(query,false);

            reply = match[1] + " successfully removed";
        }
        else
        {
            reply = match[1] + " not found";
        }
    }

    bot.sendMessage(msg.chat.id, reply);
});


// List all admin users
bot.onText(/\/admins$/, (msg) => {

    console.log('[' + new Date().toString() + '] Command /admins from username:@' + msg.from.username);
    var reply = "Invalid Command. Type /help for more info.";
    if( isAdmin(msg.from.username) )
    {
        var admins = db.adminusers.find();

        reply = "Admins:\n";

        admins.forEach(function(admin){
            reply = reply + admin.username + "\n";
        });
    }

    bot.sendMessage(msg.chat.id, reply);
});


// Add an admin user 
bot.onText(/\/addadmin ([^\s\\]+)$/, (msg, match) => {

    console.log('[' + new Date().toString() + '] Command /addadmin ' + match[1] + ' from username:@' + msg.from.username);
    var reply = "Invalid Command. Type /help for more info.";
    if( isAdmin(msg.from.username) )
    {
        var admin = {username: match[1]};
        db.adminusers.save(admin);

        reply = match[1] + " successfully added";
    }

    bot.sendMessage(msg.chat.id, reply);
});


// Delete an admin user
bot.onText(/\/deladmin ([^\s\\]+)$/, (msg, match) => {

    console.log('[' + new Date().toString() + '] Command /deladmin ' + match[1] + ' from username:@' + msg.from.username);
    var reply = "Invalid Command. Type /help for more info.";
    if( isAdmin(msg.from.username) )
    {
        var query = {
            username: match[1]
        }

        var admin = db.adminusers.find(query);

        if( admin.length )
        {
            db.adminusers.remove(query,false);

            reply = match[1] + " successfully removed";
        }
        else
        {
            reply = match[1] + " not found";
        }
    }

    bot.sendMessage(msg.chat.id, reply);
});

/* End of Admin Commands */


/* Start of Teacher Users Commands */

// List all classrooms registered in the bot
bot.onText(/\/myclassroomsTxt$/, (msg) => {

    console.log('[' + new Date().toString() + '] Command /myclassrooms from username:@' + msg.from.username);
    var reply = "";

    if( isteacherUser(msg.from.username) )
    {
        var query = {
		teacher:msg.from.username
        }
        var classrooms = db.classrooms.find(query);

        reply += "::Teacher Classrooms:\n";

        if( classrooms.length )
        {
            classrooms.forEach(function(classroom){

                reply += "  " + classroom.name +" (id: "+classroom.id + ")\n";
            });
            reply += "\n";
        }
        else
        {
            reply += "<None>\n";
        }
    }
    if( isStudentUser(msg.from.username) )
    {
        var query = {
		student:msg.from.username
        }
        var classrooms = db.classrooms.find(query);

        reply += "::Student Classrooms:\n";

        if( classrooms.length )
        {
            classrooms.forEach(function(classroom){

                reply += "  " + classroom.name +" (id: "+classroom.id + ")\n";
            });
        }
        else
        {
            reply += "<None>\n";
        }
    } else reply = "Invalid Command. Type /help for more info.";

    console.log('[' + new Date().toString() + '] ' + reply);

    bot.sendMessage(msg.chat.id, reply);
});


function myClassroomsKb(classrooms, kbcols, kbrows, last_index)
{
  const nbuttons = kbcols * kbrows;
  const next_index = last_index+nbuttons;
  const prev_index = last_index-nbuttons;
  var kbrd = []; var row = [];
  if( classrooms.length >=0 )
  {
    var n=0; i=0;
    classrooms.forEach(function(classroom){
      if(++n>last_index && n<=next_index){
        if(++i%kbcols){
          row.push({
            text: (classroom.role=="student"?GRADCAP:SCHOOL) + " " +
		   classroom.name + " (" + classroom.id + ")",
            callback_data: JSON.stringify({
              'c': 'PC', // Pick a classroom
              'i': classroom.id //classroom ID
            })
          });
        } else{
          row.push({
            text: (classroom.role=="student"?GRADCAP:SCHOOL) + " " +
		   classroom.name + " (" + classroom.id + ")",
            callback_data: JSON.stringify({
              'c': 'PC', // Pick a classroom
              'i': classroom.id //classroom ID
            })
          });
          kbrd.push(row);
          row = [];
        }
      } 
    });

    if(i%kbcols) kbrd.push(row);

    if(next_index>nbuttons){
      kbrd.unshift([
        {
          text: 'less classrooms',
          callback_data: JSON.stringify({
            'c': 'MPC', //ask for less classrooms
            'n': prev_index //prev index of the list to show the keyboard
          })
        }
      ]);
    }

    if(n>next_index){
      kbrd.push([
        {
          text: 'more classrooms',
          callback_data: JSON.stringify({
            'c': 'MPC', //ask for more classrooms 
            'n': next_index //next index of the list to show the keyboard
          })
        }
      ]);
    }
  }

  console.log('keyboard=' + JSON.stringify(kbrd));
  return(kbrd);
}

function getMyClassrooms(msg){
  var myclassrooms = []; var query=""; var classrooms=[];

  if( isteacherUser(msg.chat.username) )
  {
    query = { teacher:msg.chat.username, status:"open" };
    classrooms = db.classrooms.find(query);

    if( classrooms.length )
    {
      classrooms.forEach(function(classroom){
        if(classroom.teachers.length)
          myclassrooms.push( {"role":"teacher", "id":classroom.id, "name":classroom.name} );
      });
    }
  }
  if( isStudentUser(msg.chat.username) )
  {
    query = { student:msg.chat.username, status:"open" }
    classrooms = db.classrooms.find(query);

    if( classrooms.length )
    {
      classrooms.forEach(function(classroom){
        if(classroom.students.length)
          myclassrooms.push( {"role":"student", "id":classroom.id, "name":classroom.name} );
      });
    }
  }
  return myclassrooms;
}

function pickClassroom(msg){
  var myclassrooms = getMyClassrooms(msg);
  var kb = myClassroomsKb(myclassrooms,1,4,0);
  var opt = { reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: kb }};
  var replyTxt = "Which one of your classrooms do you want?";
  bot.sendMessage(msg.chat.id, replyTxt, opt).catch(function (err) {
    if (err)
     console.log("sendMessage error: " + err);
  });
}

// Pick one the users' classrooms registered in the bot
bot.onText(/\/myclassrooms$/, (msg) => {
  console.log('[' + new Date().toString() + '] Command /myclassrooms from username:@' + msg.from.username);
  pickClassroom(msg);
});


// Ask teacher to Join to a classroom 
bot.onText(/\/join ([^\s\\]+)$/, (msg, match) => {

  console.log('[' + new Date().toString() + '] Command /join ' + match[1] + ' from username:@' + msg.from.username);
  var reply = "Invalid Command. Type /help for more info.";

  // Check if classroom id exists
  var query = {
    id: match[1]
  }
  var classroom = db.classrooms.findOne(query);

  if( classroom != undefined )
  {
    var student_index = classroom.students.findIndex(s => s.student == msg.from.username);

    if( student_index>=0 && classroom.students[student_index].status != "exited")
    {
      reply = "Already member of classroom " + classroom.name + " (id: " + classroom.id + ")\n";
      if(classroom.students[student_index].status != "member")
        reply += "Status: Waiting teacher approval \n" ;
    }
    else
    {
      var classroom_updated = JSON.parse(JSON.stringify(classroom));
      if( student_index>=0 && classroom_updated.students[student_index].status == "exited")
      {
        //Change status of student to request at student list
        classroom_updated.students[student_index].status = "request";
      } else
      {
        classroom_updated.students.push({student:msg.from.username, status:"request"});
      }

      var options = {
        multi: false,
        upsert: false
      };
      var res = db.classrooms.update({_id:classroom._id}, classroom_updated, options);
      if(res.updated != 0)
        reply = "Request for joining classroom " + classroom.name +
                " (id: " + classroom.id + ") sent successfully. Wait for teacher approval\n";
      else
        reply = "Failed to send the joining request from student @" + msg.from.username +
                " to classroom " + classroom.name + " (id: " + classroom.id + ")\n" + 
                "Please, try again or contact Admin.";


      console.log('classroom_updated:<'+ JSON.stringify(classroom_updated) + '>\n');
      console.log(res); 
    }
  }
  else
  {
    reply = "Invalid Classroom id: " + match[1] + "\n";
  }
  bot.sendMessage(msg.chat.id, reply);
});

// Ask teacher to Join to a classroom 
bot.onText(/\/exit ([^\s\\]+)$/, (msg, match) => {

  console.log('[' + new Date().toString() + '] Command /exit ' + match[1] + ' from username:@' + msg.from.username);
  var reply = "Invalid Command. Type /help for more info.";

  // Check if classroom id exists
  var query = {
    id: match[1]
  }
  var classroom = db.classrooms.findOne(query);

  if( classroom != undefined )
  {
    var student_index = classroom.students.findIndex(s => s.student == msg.from.username);

    if( student_index>=0 ) //The student is listed in the classroom's student list
    {
      if( classroom.students[student_index].status == "exited" ) 
      {
        reply = "Student @" + msg.from.username +
                " has previously exited from classroom " + classroom.name +
                " (id: " + classroom.id +")";
      }
      else
      {
        var classroom_updated = JSON.parse(JSON.stringify(classroom));
        //Change status of student to exited at student list
        classroom_updated.students[student_index].status = "exited";
        var options = {
          multi: false,
          upsert: false
        };
        var res = db.classrooms.update({_id:classroom._id}, classroom_updated, options);
        if(res.updated != 0)
          reply = "Successfully removed student @" + msg.from.username +
                  " from classroom " + classroom.name + " (id: " + classroom.id + ")\n";
        else
          reply = "Failed to remove student @" + msg.from.username +
                  " from classroom " + classroom.name + " (id: " + classroom.id + ")\n" + 
                    "Please, try again or contact Admin.";
        }
    }
    else
    {
      reply = "Student @" + msg.from.username +
              " is not registered at classroom " + classroom.name +
              " (id: " + classroom.id +")";
    }
  }
  else
  {
    reply = "Invalid Classroom id: " + match[1] + "\n";
  }
  bot.sendMessage(msg.chat.id, reply);
});

// Get All References from a Classroom
bot.onText(/\/ref ([^\s\\]+)$/, (msg, match) => {

  console.log('[' + new Date().toString() + '] Command /ref ' + match[1] + ' from username:@' + msg.from.username);
  var reply = "Invalid Command. Type /help for more info.";


  if( isStudentUser(msg.from.username) )
  {
    var query = {
        student:msg.from.username, id:match[1]
    }
    var classrooms = db.classrooms.find(query);

    if( classrooms.length )
    {
      classrooms.forEach(function(classroom){
        query = {
          classroom:match[1]
        }
        var refs = db.references.find(query);
        refs.forEach(function(ref){
          if('file_id' in ref)
          {
            var msgTxt ="Description: "+ref.description+"\n-----------";
            var opt = {caption:msgTxt};
            sendRef(msg.chat.id, ref.file_id, opt, ref.type);
	  }
	  else
          {
            var msgTxt = ref.text+"\nDescription: "+ref.description+"\n-----------";
            bot.sendMessage(msg.chat.id, msgTxt).catch(function (err) {
              if (err)
              console.log("sendMessage error: " + err);
            });
	  }
        });

      });
    }
  }

});


//Send Messages to Student Users with the Reference files, per classroom per class
function listReferences(msg, classroom, classpos)
{
  var opt = {parse_mode: "HTML"};
  if( isStudentUser(msg.chat.username) )
  {
    var query = {
        student:msg.from.username, id:classroom
    }
    var clr = db.classrooms.findOne(query);

    if( clr != undefined )
    {
      query = {
          classroom:classroom, classpos:classpos
      }
      var refs = db.references.find(query);

      if(refs.length)
        var msgTxt = "<b>Listing</b> all references attached to Class <b>" +
                      clr.classes[classpos].name +
                      "</b> from Classroom <b>" + clr.name + "</b> (id: " + clr.id +
                      "):";
      else
        var msgTxt = "<b>No references</b> attached to Class <b>" + clr.classes[classpos].name +
                     "</b> from Classroom <b>" + clr.name + "</b> (id: " + clr.id + "), yet";
      bot.sendMessage(msg.chat.id, msgTxt, opt).catch(function (err) {
        if (err)
          console.log("sendMessage error: " + err);
      });

      var refs = db.references.find(query);
      refs.forEach(function(ref){
        if('file_id' in ref)
        {
          msgTxt = "𝕯𝖊𝖘𝖈𝖗𝖎𝖕𝖙𝖎𝖔𝖓: "+ref.description;
          opt = {caption:msgTxt, parse_mode: "HTML"};
          sendRef(msg.chat.id, ref.file_id, opt, ref.type);
        }
        else
        {
          opt = {parse_mode: "HTML"};
          //msgTxt = ref.text+"\n<b>🅰Description:</b> "+ref.description;
          msgTxt = ref.text+"\n𝕯𝖊𝖘𝖈𝖗𝖎𝖕𝖙𝖎𝖔𝖓: "+ref.description;
          bot.sendMessage(msg.chat.id, msgTxt, opt).catch(function (err) {
            if (err)
            console.log("sendMessage error: " + err);
          });
        }
      });
    }
    else
    {
      var msgTxt = "You <b>are not</b> an <b>approved member</b> of an opened classroom, yet";
      bot.sendMessage(msg.chat.id, msgTxt, opt).catch(function (err) {
        if (err)
        console.log("sendMessage error: " + err);
      });
    }
  }
  else
  {
    var adminUsers = getAdminUsernames();
    var msgTxt = "You <b>are not</b> a <b>student user</b>, yet.  If you want to become one, ask it to Admins: "+adminUsers;
    bot.sendMessage(msg.chat.id, msgTxt).catch(function (err) {
      if (err)
      console.log("sendMessage error: " + err);
    });
  }
}


// Get All References from a Classroom
bot.onText(/\/ref$/, (msg, match) => {

  console.log('[' + new Date().toString() + '] Command /ref from username:@' + msg.from.username);
  var reply = "Invalid Command. Type /help for more info.";

  //send an inline keybord to the student username
  //to let him choose a classroom to list its references
  if( isStudentUser(msg.from.username) )
  {
    var kb = choose_classroom_kb(msg.from.username, "lr", 0 );
    var kbjson = { reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: kb }};
    var kbtext = "Choose a Classroom to list all its references";
    bot.sendMessage(msg.chat.id, kbtext, kbjson);
  }

});


function sendRef(msg_id, file_id, opt, type){
  if(type == "document")
    bot.sendDocument(msg_id, file_id, opt);
  else if(type == "voice")
    bot.sendVoice(msg_id, file_id, opt);
  else if(type == "audio")
    bot.sendAudio(msg_id, file_id, opt);
  else if(type == "photo")
    bot.sendPhoto(msg_id, file_id, opt);
  else if(type == "video")
    bot.sendVideo(msg_id, file_id, opt);
  else if(type == "video_note")
    bot.sendVideoNote(msg_id, file_id);
}


function escURL(headTxt, url, tailTxt){
  var escurl = url;
  escurl = escurl.replace(/(['_*\[\]\(\)~`#+-=|{}\.!>]{1})/g, "\\$1");
  var urltext = headTxt;
  urltext = urltext.replace(/(['_*\[\]\(\)~`#+-=|{}\.!>]{1})/g, "\\$1");
  var tailtext = tailTxt;
  tailtext = tailtext.replace(/(['_*\[\]\(\)~`#+-=|{}\.!>]{1})/g, "\\$1");
  urltext += "[" + escurl + "](" + url + ")" + tailtext;
  console.log("urltext: " + urltext);
  return urltext;
}

function addFile(msg, type){

  var attach = "";
  var attach = (type == "url")?(({ text, entities}) => ({ text, entities}))(msg):msg[type];
  var session = upload_files_session.find(u => u.teacher == msg.from.username);

  if (session != undefined){
    var newfile = Object.assign({}, session, attach, {description:"", type:type}, (({message_id}) => ({message_id}))(msg));
    delete newfile.timeout;
    console.log("newfile =<"+JSON.stringify(newfile)+">");
    db.references.save(newfile);

    var kb = dismiss_kb(msg.from.username, msg.message_id);
    if(type == "url"){
      var opt = {reply_to_message_id: msg.message_id, parse_mode: "MarkdownV2", reply_markup:{inline_keyboard: kb, force_reply: true, selective: true} };
      var urlTxt = escURL("Write a description for the url (", msg.text, "). If you do not want to write a description, just click the button Dismiss, so the reference (url link) will be saved without a description.");
    } else {
      var opt = {reply_to_message_id: msg.message_id,
	         reply_markup:{inline_keyboard: kb, force_reply: true, selective: true} };
      var urlTxt = "Write a description for the reference. If you do not want to write a description, just click the button Dismiss, so the reference will be saved without a description."
    }

    bot.sendMessage(msg.chat.id, urlTxt, opt).catch(function (err) {
      if (err)
      console.log("sendMessage error: " + err);
    });
      //bot.sendDocument(msg.chat.id, msg[type].file_id);
  } else {
    var kb = choose_classroom_kb(msg.from.username, "d", 0 );
    var kbjson = { reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: kb }};
    var kbtext = "Choose a Classroom to attach the reference already sent";

    var newsession = {teacher:msg.chat.username, classroom:"",
                      description:"", type:type, classpos:"", hasfile:true, timeout:2};
    var newfile = Object.assign( {}, newsession, attach, (({message_id}) => ({message_id}))(msg) );
    set_upload_files_session(newfile);

    bot.sendMessage(msg.chat.id, kbtext, kbjson);
  }
}


bot.on("message", msg => {
  console.log("message =<"+JSON.stringify(msg)+">");
  if (typeof msg.document === "object") {
    //the message is a document file
    console.log("typeof msg.document === object");
    addFile(msg, "document");
    
  } else if (typeof msg.audio === "object") {
    //the message is a audio file
    console.log("typeof msg.audio === object");
    addFile(msg, "audio");
    
  } else if (typeof msg.voice === "object") {
    //the message is a voice file
    console.log("typeof msg.voice === object");
    addFile(msg, "voice");
    
  } else if (typeof msg.photo === "object") {
    //the message is a photo file
    console.log("typeof msg.photo === object");
    addFile(msg, "photo");
    
  } else if (typeof msg.video === "object") {
    //the message is a video file
    console.log("typeof msg.video === object");
    addFile(msg, "video");
    
  } else if (typeof msg.video_note === "object") {
    //the message is a video_note file
    console.log("typeof msg.video_note === object");
    addFile(msg, "video_note");
    
  } else if (typeof msg.entities === "object" && msg.entities[0].type == "url") {
    //the message is a url link
    console.log("typeof msg.entities === object");
    if (msg.entities[0].type == "url"){
      console.log("type == url");
      addFile(msg, "url");
    }

  } else if (msg.text) {
    console.log("type == text");
    reply_main_cmd(msg);
    reply_menu(msg);
    if(msg.text.match(/sonho/g))
    {
      var kbtext = "Estuda muito para conseguir realizar seu sonho. Persevere e nunca desista!!";
      bot.sendMessage(msg.chat.id, kbtext).catch(function (err) {
        if (err) console.log("sendMessage error: " + err);
      });
    }
    if(msg.text.match(/corona/g))
    {
      var kbtext = "Febre, dificuldade de respirar, dor de garganta, cansaço e tosse seca são sintomas comuns da gripe, mas também do novo coronavírus (Covid-19). Se você apresentar esses sintomas iniciais do vírus, a orientação do Ministério da Saúde é ligar no número 136 para buscar informações do que fazer ou procurar uma Unidade Básica de Saúde (UBS)."
      bot.sendMessage(msg.chat.id, kbtext).catch(function (err) {
        if (err) console.log("sendMessage error: " + err);
      });
    }
    if(msg.text.match(/saudade/g))
    {
      var kbtext = "Chama o papai para rezar uma oração e dormir com você!";
      bot.sendMessage(msg.chat.id, kbtext).catch(function (err) {
        if (err) console.log("sendMessage error: " + err);
      });
    }
    if( isteacherUser(msg.chat.username) ){
      var doc_id = ( msg.message_id - 2 );
      var doc = db.references.findOne({username: msg.chat.username, message_id:doc_id});

      if( doc == undefined ){
        var ind = upload_files_session.findIndex(u => u.teacher == msg.chat.username);
        console.log("Session:<"+JSON.stringify(upload_files_session[ind])+">\n");
        if(ind>=0 && 'hasfile' in upload_files_session[ind]){
          doc_id = upload_files_session[ind].message_id;
          doc = db.references.findOne({username: msg.chat.username, message_id:doc_id});
        }
      }

      console.log("DOC found=<"+JSON.stringify(doc)+">"); 
      if( doc != undefined ){
        var doc_update = JSON.parse(JSON.stringify(doc));
        doc_update.description = msg.text;
        delete doc_update.message_id;
        var options = {
          multi: true,
          upsert: false
        };
        var updated = db.references.update({_id:doc._id}, doc_update, options);
        console.log(updated); 

        var kbtext = "You have successfully attached a reference to your classroom";
        bot.sendMessage(msg.chat.id, kbtext).catch(function (err) {
          if (err) console.log("sendMessage error: " + err);
        });
        set_upload_files_session({teacher:msg.chat.username,
	                          classroom:doc.classroom, classpos:doc.classpos, timeout:2});
        console.log("upload_files_session=<"+JSON.stringify(upload_files_session)+">");

      }
    }
  }
});


// Add a reference to a classroom
bot.onText(/\/addref$/, (msg, match) => {

  if(isteacherUser(msg.chat.username)){
    var kb = choose_classroom_kb(msg.from.username, "d", 0 );
    var kbjson = { reply_markup: { inline_keyboard: kb }};
    var kbtext = "Please, choose a Classroom to add a reference (documents, voice messages, video/audio files or url link)";

    bot.sendMessage(msg.chat.id, kbtext, kbjson);
  }
});

function approveStudents(msg){
  if(isteacherUser(msg.chat.username)){
    var kb = choose_classroom_kb(msg.chat.username, "s", 0 );
    var kbjson = { reply_markup: { inline_keyboard: kb }};
    var kbtext = "Choose a Classroom to Approve Students Membership";

    bot.sendMessage(msg.chat.id, kbtext, kbjson);
  }
}


// Approve students request to join classroom
bot.onText(/\/approve$/, (msg, match) => {
  approveStudents(msg);
});


function menu_kb(command, args){
  var query = {
    command:command
  };
  var cmd = menu.find(m => m.command == command);
  var kb = [];
  var cd = {};
  cmd.objects.forEach(function(obj,i,o){
    console.log("'c':" +  cmd.command+i + " >");
    cd = Object.assign({}, {'c': cmd.command+i}, args);
    kb.push([{ text: obj.button_label,
              callback_data: JSON.stringify(cd)
            }]
    );
  });
  console.log("menu_kb:<" + JSON.stringify(kb) + ">");
  return(kb);
}


function new_classroom_kb(classroom_id){
  var kb = [
    [{ text: 'Edit Name',
       callback_data: JSON.stringify({
         'c': 'EC0', //command approve
         'i': classroom_id //classroom ID
       })
     },
     { text: 'Edit Institution',
       callback_data: JSON.stringify({
         'c': 'EC1', //command approve
         'i': classroom_id //classroom ID
       })
    }],
    [{ text: 'Edit Course',
       callback_data: JSON.stringify({
         'c': 'EC2', //command approve
         'i': classroom_id //classroom ID
       })
     },
     { text: 'Edit Description',
       callback_data: JSON.stringify({
         'c': 'EC3', //command approve
         'i': classroom_id //classroom ID
       })
    }]
  ];
  return(kb);
}


// new classroom
bot.onText(/\/new ([^\s\\]+)$/, (msg, match) => {

  var opt = {parse_mode: "HTML"};
  if(isteacherUser(msg.chat.username)){
    
    var query = {
      id: match[1]
    };
    var exist = db.classrooms.findOne(query);

    if( exist == undefined )
    {
      db.classrooms.save({id:match[1], name:"", institution:"",
	                  course:"", description:"", hours:"", status:"open",
                          teachers:[{teacher:msg.chat.username, status:"member"}],
                          students:[]});
      reply = WINKING_FACE+ " Classroom <b>" + match[1] + "</b> successfully created. Please configure the classroom profile";
      //var kb = new_classroom_kb(match[1]);
      var kb = menu_kb("EC", {'i': match[1]});
      opt = Object.assign({}, opt, { reply_markup: { inline_keyboard: kb }});
    } else
    {
      var reply = WEARY + " Classroom_id <b>" + match[1] + "</b> already <b>exists</b>. Please run the command again with another classroom_id.";
    }
  } else
  {
    var adminUsers = getAdminUsernames();
    var reply = OCT + " This command is <b>only</b> available for <b>teacher users</b>. You are not a teacher user yet. If you want to become one, please ask a Admin users: " + adminUsers;
  }

  bot.sendMessage(msg.chat.id, reply, opt).catch(function (err) {
    if (err) console.log("sendMessage error: " + err);
  });
});


// new classroom
bot.onText(/\/new2 ([^\s\\]+)$/, (msg, match) => {

  var opt = {parse_mode: "HTML"};
  if(isteacherUser(msg.chat.username)){
    
    var query = {
      id: match[1]
    };
    var exist = db.classrooms.findOne(query);

    if( exist == undefined )
    {
      db.classrooms.save({id:match[1], name:"", institution:"", course:"", description:"", hours:""});
      reply = "Classroom <b>" + match[1] + "</b> successfully created. Please configure the classroom";
      //var kb = new_classroom_kb(match[1]);
      var kb = menu_kb("EC", {'i': match[1]});
      opt = Object.assign({}, opt, { reply_markup: { inline_keyboard: kb }});
    } else
    {
      var reply = "Classroom_id <b>" + match[1] + "</b> already <b>exists</b>. Please run the command again with another classroom_id (it must be without spaces)";
    }
  } else
  {
    var adminUsers = getAdminUsernames();
    var reply = "This command is <b>only</b> available for <b>teacher users</b>. You are not a teacher user yet. If you want to become one, please ask a Admin users: " + adminUsers;
  }

  bot.sendMessage(msg.chat.id, reply, opt).catch(function (err) {
    if (err) console.log("sendMessage error: " + err);
  });
});


function setStatus(classroom_id, student_username, status)
{
  // Check if classroom id exists
  var query = {
    id: classroom_id
  };
  var exist = db.classrooms.findOne(query);
  console.log(JSON.stringify(exist)); 

  var ret = {reply: "Invalid classroom id: " + classroom_id , updated:0};

  if( exist != undefined )
  {
    var student_index = exist.students.findIndex(s => s.student == student_username);

    if( student_index>=0 )
    {
      var classroom_updated = JSON.parse(JSON.stringify(exist));
      classroom_updated.students[student_index].status = status;
      var options = {
        multi: true,
        upsert: false
      };
      var res = db.classrooms.update({_id:exist._id}, classroom_updated, options);
      if(res.updated != 0)
        ret = {reply : "Set Status " + status + " for student  "+ student_username + " at Classroom " + exist.name + " (id: " + exist.id + ")", updated: 1};
      else
        ret = {reply : "Error Setting Status " + status + " for student  "+ student_username + " at Classroom " + exist.name + " (id: " + exist.id + ")", updated: 0};

      console.log('old_status:<'+ JSON.stringify(exist.students[student_index]) + '>');
      console.log('updated_status:<'+ JSON.stringify(classroom_updated.students[student_index]) + '>');
      console.log(res); 
    }
    else
    {
      ret = {reply : "Student " + student_username + " not found in Classroom " +  exist.name + " (id: " + exist.id + ")", updated: 0};
    }
  }
  return(ret);
}


function classes_inline_kb3(teacher_username, context, classroom_id, last_index)
{
  const kblines = 3;
  const next_index = last_index+kblines;
  const prev_index = last_index-kblines;
  var n=0;
  var kbrd = [];
    if( isteacherUser(teacher_username) )
    {
      var query = {
          teacher:teacher_username
      }
      var classrooms = db.classrooms.find(query);

      if( classrooms != undefined )
      {
          classrooms.forEach(function(classroom){
            if(classroom.id == classroom_id && classroom.status == "open"){
              var nlen = classroom.classes.length;
              for(n=last_index; (n<next_index) && (n<nlen); n++){
                kbrd.push([
                  {
                    text: classroom.classes[n].name,
                    callback_data: JSON.stringify({
                      'c': 'cl', //command choose class
                      'f': context, //context for: d->reference
                      'i': classroom.id, //Classroom ID
                      'ci': n //class array index
                  })
                  }
                ]);
              }

              if(next_index>kblines){
                kbrd.unshift([
                  {
                    text: 'less classes',
                    callback_data: JSON.stringify({
                      'c': 'mcl', //ask for more classes list
                      'f': context, //context for: s->student, d->reference
                      'i': classroom.id, //context for: s->student, d->reference
                      'n': prev_index //prev index of the classes list to show the keyboard
                  })
                  }
                ]);
              }
              if(n>=next_index){
                kbrd.push([
                  {
                    text: 'more classes',
                    callback_data: JSON.stringify({
                      'c': 'mcl', //ask for more classes list
                      'f': context, //context for: s->student, d->reference
                      'i': classroom.id, //context for: s->student, d->reference
                      'n': next_index //next index of the classes list to show the keyboard
                  })
                  }
                ]);
              }
            } 
          });
      }
      else
      {
      }
  }

  console.log('keyboard=' + JSON.stringify(kbrd));
  console.log('keyboard=' + kbrd.toString());
  return(kbrd);
}


function choose_classroom_kb(teacher_username, context, last_index)
{
  const kblines = 3;
  const next_index = last_index+kblines;
  const prev_index = last_index-kblines;
  var kbrd = [];
    if( isteacherUser(teacher_username) )
    {
      var query = {
          teacher:teacher_username
      }
      var classrooms = db.classrooms.find(query);

      if( classrooms != undefined )
      {
          var n=0;
          classrooms.forEach(function(classroom){
            if(classroom.status == "open"){
              if(++n>last_index && n<=next_index){
                kbrd.push([
                  {
                    text: classroom.name + " (" + classroom.id + ")",
                    callback_data: JSON.stringify({
                      'c': 'cc', //command choose classroom
                      'f': context, //context for: s->student, d->reference
                      'i': classroom.id //classroom ID
                  })
                  }
                ]);
              } 
            } 
          });

          if(next_index>kblines){
            kbrd.unshift([
              {
                text: 'less classrooms',
                callback_data: JSON.stringify({
                  'c': 'mc', //ask for less classrooms to be approved
                  'f': context, //context for: s->student, d->reference
                  'n': prev_index //prev index of the students list to show the keyboard
              })
              }
            ]);
          }

          if(n>next_index){
            kbrd.push([
              {
                text: 'more classrooms',
                callback_data: JSON.stringify({
                  'c': 'mc', //ask for more classrooms to be approved
                  'f': context, //context for: s->student, d->reference
                  'n': next_index //next index of the students list to show the keyboard
              })
              }
            ]);
          }
      }
      else
      {
      }
  }

  console.log('keyboard=' + JSON.stringify(kbrd));
  console.log('keyboard=' + kbrd.toString());
  return(kbrd);
}

function hasPermission(username, callback){
  return callback(username);
}

function main_cmd_kb(permission, dbname, username, context, last_index)
{
  const kblines = 3;
  const next_index = last_index+kblines;
  const prev_index = last_index-kblines;
  var kbrd = [];
    if(hasPermission(username, "is"+permission+"User" ))
    //if( isteacherUser(teacher_username) )
    {
      var query = {
          [permission]:username
      }
      var items = db[dbname].find(query);

      if( items != undefined )
      {
          var n=0;
          items.forEach(function(item){
            if(item.status == "open"){
              if(++n>last_index && n<=next_index){
                kbrd.push([
                  {
                    text: item.name + " (" + item.id + ")",
                    callback_data: JSON.stringify({
                      'c': 'cc', //command choose classroom
                      'f': context, //context for: s->student, d->reference
                      'i': classroom.id //classroom ID
                  })
                  }
                ]);
              } 
            } 
          });

          if(next_index>kblines){
            kbrd.unshift([
              {
                text: 'less classrooms',
                callback_data: JSON.stringify({
                  'c': 'mc', //ask for less classrooms to be approved
                  'f': context, //context for: s->student, d->reference
                  'n': prev_index //prev index of the students list to show the keyboard
              })
              }
            ]);
          }

          if(n>next_index){
            kbrd.push([
              {
                text: 'more classrooms',
                callback_data: JSON.stringify({
                  'c': 'mc', //ask for more classrooms to be approved
                  'f': context, //context for: s->student, d->reference
                  'n': next_index //next index of the students list to show the keyboard
              })
              }
            ]);
          }
      }
      else
      {
      }
  }

  console.log('keyboard=' + JSON.stringify(kbrd));
  console.log('keyboard=' + kbrd.toString());
  return(kbrd);
}


function choose_student_kb(teacher_username, classroom_id, last_index)
{
  const kblines = 3;
  const next_index = last_index+kblines;
  const prev_index = last_index-kblines;
  var kbrd = [];
    if( isteacherUser(teacher_username) )
    {
      var query = {
          teacher:teacher_username
      }
      var classrooms = db.classrooms.find(query);

      if( classrooms != undefined )
      {
        var classroom = classrooms.filter(c => c.id == classroom_id);

        if( classroom.length )
        {
          var n=0;
          classroom[0].students.forEach(function(student){
            if(student.status == "request"){
              if(++n>last_index && n<=next_index){
                kbrd.push([
                  {
                    text: student.student+': YES',
                    callback_data: JSON.stringify({
                      'c': 'a', //command approve
                      's': student.student, //student username
                      'i': classroom[0].id, //classroom ID
                      'a': 'YES' //answer YES
                  })
                  },
                  {
                    text: student.student+': NO',
                    callback_data: JSON.stringify({
                      'c': 'a', //command approve
                      's': student.student, //student username
                      'i': classroom[0].id, //classroom ID
                      'a': 'NO' //answer NO
                    })
                  },
                ]);
              } 
            } 
          });

          if(next_index>kblines){
            kbrd.unshift([
              {
                text: 'less students',
                callback_data: JSON.stringify({
                  'c': 'ms', //ask for more students to be approved
                  'i': classroom[0].id, //classroom ID
                  'n': prev_index //prev index of the students list to show the keyboard
                })
              }
            ]);
          }
          if(n>next_index){
            kbrd.push([
              {
                text: 'more students',
                callback_data: JSON.stringify({
                  'c': 'ms', //ask for more students to be approved
                  'i': classroom[0].id, //classroom ID
                  'n': next_index //next index of the students list to show the keyboard
                })
              }
            ]);
          }
        } 
      }
      else
      {
      }
  }

  console.log('keyboard=' + JSON.stringify(kbrd));
  console.log('keyboard=' + kbrd.toString());
  return(kbrd);
}


function dismiss_kb(teacher_username, message_id)
{
var kbrd = [];
  kbrd.push([
    {
      text: 'Dismiss',
      callback_data: JSON.stringify({
        'c': 'd', //command dismiss
        'i': message_id //messae_id
      })
    }
  ]);

  console.log('keyboard=' + JSON.stringify(kbrd));
  console.log('keyboard=' + kbrd.toString());
  return(kbrd);
}


// Listener (handler) for callback data 
bot.on('callback_query', (callbackQuery) => {
  var message = callbackQuery.message;
  var data = JSON.parse(callbackQuery.data);
  if(data.c == "a"){ //approve student membership or not
    var ret = {reply:'Invalid argument for command callback approve',updated:0};
    if(data.a == "YES"){
      ret = setStatus(data.i, data.s, "member");
    }
    else if(data.a == "NO"){
      ret = setStatus(data.i, data.s, "denied");
    }
    console.log("updated = <" + ret.updated + "> - " + ret.reply); 
    if(ret.updated!=0) {
      var kb = choose_student_kb(message.chat.username, data.i, 0 );
      var kbtext = "Please approve Students Membership at " + data.i + " Classroom";
      editMT(message.chat.id, message.message_id, ret.reply+"\n"+kbtext);
      editMRM(message.chat.id, message.message_id, kb);
    } else {
      bot.sendMessage(message.chat.id, ret.reply+"\nAny doubts contact Admin");
    }
  }
  else if(data.c == "MPC"){ //list more classrooms to Pick one
    var myclassrooms = getMyClassrooms(message);
    var kb = myClassroomsKb(myclassrooms,1,4,data.n);
    editMRM(message.chat.id, message.message_id, kb);
  }
  else if(data.c == "ms"){ //list more students for some context
    var kb = choose_student_kb(message.chat.username, data.i, data.n );
    editMRM(message.chat.id, message.message_id, kb);
  }
  else if(data.c == "mc"){ //list more classrooms for some context
    var kb = choose_classroom_kb(message.chat.username, data.f, data.n );
    editMRM(message.chat.id, message.message_id, kb);
  }
  else if(data.c == "mcl"){ //list more classes for some context
    var kb = classes_inline_kb3(message.chat.username, data.f, data.i, data.n );
    editMRM(message.chat.id, message.message_id, kb);
  }
  else if(data.c == "cc"){ //Choose Classroom to some action
    //console.log("message.chat.username=<"+message.chat.username+">");
    //console.log("message=<"+JSON.stringify(message)+">");
    if(data.f == "s"){ //Choose Classroom to approve students
      var kb = choose_student_kb(message.chat.username, data.i , 0 );
      var kbtext = "Please approve Students Membership at " + data.i + " Classroom";

      editMT(message.chat.id, message.message_id, kbtext);
      editMRM(message.chat.id, message.message_id, kb);

    } else if(data.f == "d"){ // Choose a classroom to send a reference
      var kb = classes_inline_kb3(message.chat.username, data.f, data.i , 0 );
      var kbtext = "Please choose a class from " + data.i + " Classroom to attach the reference";

      editMT(message.chat.id, message.message_id, kbtext);
      editMRM(message.chat.id, message.message_id, kb);

    } else if(data.f == "lr"){ // Choose a classroom to list references
      var kb = classes_inline_kb3(message.chat.username, data.f, data.i , 0 );
      var kbtext = "Please choose a class from " + data.i + " Classroom to list its references";

      editMT(message.chat.id, message.message_id, kbtext);
      editMRM(message.chat.id, message.message_id, kb);
    }

  } else if(data.c == "cl"){ //Choose a class to some action
    if(data.f == "d"){ //Choose a class to send a reference (the classroom was already choosen)

      var ind = upload_files_session.findIndex(u => u.teacher == message.chat.username);
      if(ind>=0 && 'hasfile' in upload_files_session[ind]){
      //If a reference was first sent by Teacher, just set classroom and class to attach and save it
        var newfile = JSON.parse(JSON.stringify(upload_files_session[ind]));
        delete newfile.hasfile;
        delete newfile.timeout;
        newfile.classroom = data.i;
        newfile.classpos = data.ci;
        db.references.save(newfile);
        var kb = dismiss_kb(message.from.username, newfile.message_id);
        if('entities' in newfile &&
           'type' in newfile.entities[0] &&
           newfile.entities[0].type == "url"){
          var opt = {reply_to_message_id: newfile.message_id, parse_mode: "MarkdownV2", reply_markup:{inline_keyboard: kb, force_reply: true, selective: true} };
          var urlTxt = escURL("Write a description for the url (", newfile.text, "). If you do not want to write a description, just click the button Dismiss, so the reference (url link) will be saved without a description.");
        } else {
          var opt = {reply_to_message_id: newfile.message_id,
	             reply_markup:{inline_keyboard: kb, force_reply: true, selective: true} };
          var urlTxt = "Write a description for the reference. If you do not want to write a description, just click the button Dismiss, so the reference will be saved without a description."
        }
    
        bot.sendMessage(message.chat.id, urlTxt, opt).catch(function (err) {
          if (err)
          console.log("sendMessage error: " + err);
        });

            
      } else
      {
        //The classroom and class are already choosen. Now ask for the reference
        var kbtext = "Please, send one or more references (documents, voice messages, video/audio files or url links) to attach them to " + data.i + " Classroom";

        set_upload_files_session({teacher:message.chat.username,
	                          classroom:data.i, classpos:data.ci, timeout:2});

        console.log("upload_files_session=<"+JSON.stringify(upload_files_session)+">");

        editMT(message.chat.id, message.message_id, kbtext);
      }

    } 
    if(data.f == "lr"){ //Choose a class to list its references
      listReferences(message, data.i, data.ci);
    }
  } else if(data.c == "d"){ // Dismiss button pressed
    var kbtext = "You have successfully attached a reference to your classroom";
    editMT(message.chat.id, message.message_id, kbtext);
    var ind = upload_files_session.findIndex(u => u.teacher == message.chat.username);
    var s = upload_files_session[ind];
    set_upload_files_session({teacher:message.chat.username,
                              classroom:s.classroom, classpos:s.classpos, timeout:2});
    console.log("upload_files_session=<"+JSON.stringify(upload_files_session)+">");

  } else if(data.c == "EN"){ // Edit Name of new Classroom
    var kbtext = "Type a name for the classroom (id: " + data.i + ")";
    editMT(message.chat.id, message.message_id, kbtext);
    set_edit_classroom_session({teacher:message.chat.username,
                                classroom:data.i, timeout:2});
    console.log("edit_classroom_session=<"+JSON.stringify(edit_classroom_session)+">");
  } else if('AF' in data){
    console.log("Function "+data.AF+"();");
    //console.log(Object.keys(global));
    //Object.global[data.AF]();
    var sdata = JSON.parse(JSON.stringify(data));
    delete sdata.c;
    funcs[data.AF](message,sdata);
  }

  menu.forEach(function(cmd,i,o){
    if('objects' in cmd){//Edit field in a database, as configured in menu.json
      cmd.objects.forEach(function(obj,i,o){
        if(data.c == cmd.command+i){
          var sdata = JSON.parse(JSON.stringify(data));
          delete sdata.c;
          set_menu_session({username:message.chat.username, cmd:cmd.command,
                            objpos:i, timeout:2, data:sdata});
          bot.sendMessage(message.chat.id,
		          MEMO + " " +  obj.editMessage.replace(/\$filterObj/,data.i),
		          {parse_mode: "HTML"}).catch(function (err) {
            if (err)
              console.log("sendMessage error: " + err);
          });
        }
      });
      if(data.c == cmd.command){
        var sdata = JSON.parse(JSON.stringify(data));
        delete sdata.c;
        var kb = menu_kb(cmd.command, sdata);
        var opt = {parse_mode: "HTML", reply_to_message_id: message.message_id, reply_markup: { inline_keyboard: kb }};
        var dbData="";
        var query = {[cmd.filterObj]:data.i};
        var item = db[cmd.dbname].findOne(query);
        cmd.objects.forEach(function(obj){
          dbData += "<b>"+obj.name+":</b> " + ((item[obj.name]!="")?item[obj.name]:PROHIBITED) +"\n";
        });
        bot.sendMessage(message.chat.id,
                        cmd.command_title.replace(/\$filterObj/,data.i)+"\n"+dbData,
                        opt).catch(function (err) {
          if (err)
            console.log("sendMessage error: " + err);
        });
      }
    }
    if('menuItems' in cmd){//Choose a menu item field, as configured in menu.json
      if(data.c == cmd.command){
        var sdata = JSON.parse(JSON.stringify(data));
        delete sdata.c;
        set_menu_session({username:message.chat.username, cmd:cmd.command,
                          timeout:2, data:sdata});
        reply_menuItems(message,cmd,sdata);
      }
    }
  });

});


var funcs = {
  pickClassroom: function(param){ console.log("pickClassroom"); pickClassroom(param); },
  approveStd: function(msg,data){ console.log("approveStd"); approveStd(msg,data); }
};


function approveStd(msg, data){
  var kb = choose_student_kb(msg.chat.username, data.i , 0 );
  var kbtext = "Please approve Students Membership at " + data.i + " Classroom";

  editMT(msg.chat.id, msg.message_id, kbtext);
  editMRM(msg.chat.id, msg.message_id, kb);
}


function reply_menuItems(msg, cmd, data){
var kbrd = [];
var actionCommand = {};
var actionFunction = {};
var cb_data = {};

  cmd.menuItems.forEach(function(item,i){
    actionCommand = ('actionCommand' in item)?{"c":item.actionCommand}:{};
    actionFunction = ('actionFunction' in item)?{"AF":item.actionFunction}:{};
    cb_data = Object.assign({}, actionCommand, actionFunction, data);
    kbrd.push([{ text: item.button_label,
       callback_data: JSON.stringify(cb_data)
    }]);
  });
  console.log("kbrd:"+JSON.stringify(kbrd));

  var opt = {parse_mode: "HTML", reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: kbrd }};
  bot.sendMessage(msg.chat.id, cmd.command_title, opt).catch(function (err) {
    if (err)
      console.log("sendMessage error: " + err);
  });
}

function editMRM(chat_id, message_id, kb){
  bot.editMessageReplyMarkup({
    inline_keyboard: kb
  }, {
    chat_id: chat_id, 
    message_id: message_id
  }).catch(function (err) {
    if (err)
    console.log("editMessageReplyMarkup error");
  });
}

function editMT(chat_id, message_id, kbtext){
  bot.editMessageText(kbtext, {
    chat_id: chat_id,
    message_id: message_id,
    parse_mode: 'Markdown'
  }).catch(function (err) {
    if (err)
    console.log("editMessageText error: "+err);
  });
}


// countdown the timeout session and remove session when reach zero
function session_timeout_countdown(){
  upload_files_session.forEach(function(s,i,o){
    if(!--(s.timeout)) o.splice(i,1);
  });
  menu_session.forEach(function(s,i,o){
    if(!--(s.timeout)) o.splice(i,1);
  });
}


function set_upload_files_session(session){
var ind = upload_files_session.findIndex(u => u.teacher == session.teacher);
  if(ind >= 0 ){
    //if there is already an oppened session for a teacher, remove it and insert the new one
    upload_files_session.splice(ind,1,session);
  } else {
    //if there isn't an oppened session for a teacher, insert one
    upload_files_session.push(session);
  }
}


function set_menu_session(session){
var ind = menu_session.findIndex(u => u.username == session.username);
  if(ind >= 0) menu_session.splice(ind,1,session);
  else menu_session.push(session);
  console.log("menu_session=<"+JSON.stringify(menu_session)+">");
}


function reply_main_cmd(msg){
  console.log("reply_main_cmd()\n");
  menu.forEach(function(item,i,o){
    var found = null;
    if ('maincmd' in item) found = item.maincmd.match(msg.text);
    if (found != null)
      console.log("found=<"+JSON.stringify(found)+">");
    else
      console.log("found=NULL");
  });
}


function reply_menu(msg){
  var mi = menu_session.findIndex(m => m.username == msg.chat.username);
  var replyTxt = "Your answer took too long. Please start the command again";
  var title = "";

  if(mi>=0){
    var cmd = menu_session[mi].cmd;
    var pos = menu_session[mi].objpos;
    var data = menu_session[mi].data;
    var menu_cmd = menu.find(m => m.command == cmd);
    if(menu_cmd != undefined)
    {
      var dbname = menu_cmd.dbname;
      var query = {[menu_cmd.filterObj]:data.i};
      var item = db[dbname].findOne(query);
      if(item != undefined)
      {
        var newitem = JSON.parse(JSON.stringify(item));
        newitem[menu_cmd.objects[pos].name] = msg.text;
        var options = { multi: false, upsert: false };
        var res = db[dbname].update({_id:item._id}, newitem, options);
        if(res.updated != 0)
          replyTxt = WINKING_FACE+" "+menu_cmd.successMsg.replace(/\$filterObj/,data.i);
        else
          replyTxt = FAIL+" "+menu_cmd.failMsg.replace(/\$filterObj/,data.i);

        item = db[dbname].findOne(query);
        menu_cmd.objects.forEach(function(obj){
          title += "<b>"+obj.name+":</b> " + ((item[obj.name]!="")?item[obj.name]:PROHIBITED) +"\n";
        });
      }
      title += MEMO+" "+menu_cmd.command_title.replace(/\$filterObj/,data.i);
    }
    menu_session.splice(mi,1);
    var kb = menu_kb(cmd, {'i': data.i});
    
    //editMRM(msg.chat.id, msg.message_id, kb);

    var opt = {parse_mode: "HTML", reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: kb }};
    bot.sendMessage(msg.chat.id, replyTxt + "\n" + title, opt).catch(function (err) {
      if (err)
        console.log("sendMessage error: " + err);
    });
  }
}

/* End of User Commands */

/* Incomplete Syntax Handlers */
bot.onText(/\/join$/, (msg, match) => {
    var reply = "Incomplete Syntax. Type /help for more info.";
    bot.sendMessage(msg.chat.id, reply);
});

bot.onText(/\/deladmin$/, (msg, match) => {
    var reply = "Incomplete Syntax. Type /help for more info.";
    bot.sendMessage(msg.chat.id, reply);
});

bot.onText(/\/addadmin$/, (msg, match) => {
    var reply = "Incomplete Syntax. Type /help for more info.";
    bot.sendMessage(msg.chat.id, reply);
});

bot.onText(/\/delteacher$/, (msg, match) => {
    var reply = "Incomplete Syntax. Type /help for more info.";
    bot.sendMessage(msg.chat.id, reply);
});

bot.onText(/\/addteacher$/, (msg, match) => {
    var reply = "Incomplete Syntax. Type /help for more info.";
    bot.sendMessage(msg.chat.id, reply);
});

bot.onText(/\/exit$/, (msg, match) => {
    var reply = "Incomplete Syntax. Type /help for more info.";
    bot.sendMessage(msg.chat.id, reply);
});

