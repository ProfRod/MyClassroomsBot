process.env["NTBA_FIX_319"] = 1;
const config = require('./config.json'),
      TelegramBot = require('node-telegram-bot-api'),
      _ = require('lodash'),
      db = require('diskdb');
// MyClassroomsBot
// Author: Rodrigo Martins Fernandes (@ProfRod at telegram)

// Instantiate Telegram Bot
const bot = new TelegramBot(config.token, {polling: true});
const apiurl = "";
const helpkeyboard = {"reply_markup": {"keyboard": [["/help"],["/myclassrooms"],["/addref"]],"one_time_keyboard":true}};
const teacherhelpkeyboard = {"reply_markup": {"keyboard": [["/help"],["/myclassrooms"],["/approve"],["/addref"]],"one_time_keyboard":true}};
const algorithm = 'aes256';
var upload_files_session = [];

// Connect to diskdb
db.connect('./data', ['adminusers','teacherusers','studentusers','classrooms','references']);

// helper functions
function isAdmin(username)
{
    var isAdmin = db.adminusers.find({username:username});
    if( isAdmin.length )
    {
        return true;
    }

    return false;
}

function isStudentUser(username)
{

    var isStudentUser = db.studentusers.find({username:username});

    if( isStudentUser.length )
    {
        return true;
    }
    if(isTeacherUser(username)) return true; else return isAdmin(username);
}

function isTeacherUser(username)
{

    var isTeacherUser = db.teacherusers.find({username:username});

    if( isTeacherUser.length )
    {
        return true;
    }

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
    
    if( isTeacherUser(msg.from.username) )
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
        reply = reply + "/join <classroom_id> - Join a classroom\n";
        reply = reply + "/exit <classroom_id> - Exit a classroom\n";

        if( isTeacherUser(msg.from.username) )
        {
            reply = reply + "\nTeacher Commands:\n";
            reply = reply + "/new <classroom name> - Create new classroom\n";
            reply = reply + "/approve <classroom name> <student username> - Approve student joining in the classroom\n";
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
bot.onText(/\/myclassrooms$/, (msg) => {

    console.log('[' + new Date().toString() + '] Command /myclassrooms from username:@' + msg.from.username);
    var reply = "";

    if( isTeacherUser(msg.from.username) )
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
console.log("AKI 1"); 
    var student_index = classroom.students.findIndex(s => s.student == msg.from.username);

    if( student_index>=0 && classroom.students[student_index].status != "exited")
    {
console.log("AKI 1.1"); 
      reply = "Already member of classroom " + classroom.name + " (id: " + classroom.id + ")\n";
      if(classroom.students[student_index].status != "member")
        reply += "Status: Waiting teacher approval \n" ;
    }
    else
    {
console.log("AKI 1.2"); 
      var classroom_updated = JSON.parse(JSON.stringify(classroom));
      if( student_index>=0 && classroom_updated.students[student_index].status == "exited")
      {
console.log("AKI 1.2.1"); 
        //Change status of student to request at student list
        classroom_updated.students[student_index].status = "request";
      } else
      {
console.log("AKI 1.2.2"); 
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

  var session = upload_files_session.find(u => u.teacher == msg.from.username);
  if (session != undefined){
    delete session.timeout;
    //console.log("msg.entities[0] =<"+JSON.stringify(msg.entities[0])+">");
    console.log("session =<"+JSON.stringify(upload_files_session)+">");
    //var attach = (type == "url")?(({ text, msg.entities[0] }) => ({ text, msg.entities[0] }))(msg):msg[type];
    var attach = "";
    var attach = (type == "url")?(({ text, entities}) => ({ text, entities}))(msg):msg[type];
    console.log("attach =<"+JSON.stringify(attach)+">");
    var newfile = Object.assign({}, session, attach, {description:""}, (({message_id}) => ({message_id}))(msg));
    console.log("filesession =<"+JSON.stringify(upload_files_session)+">");
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
    var kb = approve_inline_kb2(msg.from.username, "d", 0 );
    var kbjson = { reply_to_message_id: msg.message_id, reply_markup: { inline_keyboard: kb }};
    var kbtext = "Choose a Classroom to attach the reference already sent";

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
    
  } else if (typeof msg.entities === "object") {
    //the message is a url link
    console.log("typeof msg.entities === object");
    if (msg.entities[0].type == "url"){
      console.log("type == url");
      addFile(msg, "url");
    }

//  } else if (typeof msg.reply_to_message  === "object") {
//    console.log("type == reply message");
  } else if (msg.text) {
    console.log("type == text");
    if( isTeacherUser(msg.chat.username) ){
      var doc_id = ( msg.message_id - 2 );
      var doc = db.references.findOne({username: msg.chat.username, message_id:doc_id});
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

      }
    }
  }
});


// Add a reference to a classroom
bot.onText(/\/addref$/, (msg, match) => {

  var kb = approve_inline_kb2(msg.from.username, "d", 0 );
  var kbjson = { reply_markup: { inline_keyboard: kb }};
  var kbtext = "Please, choose a Classroom to add a reference (documents, voice messages, video/audio files or url link)";

  bot.sendMessage(msg.chat.id, kbtext, kbjson);
});

// Approve students request to join classroom
bot.onText(/\/approve$/, (msg, match) => {

  var kb = approve_inline_kb2(msg.from.username, "s", 0 );
  var kbjson = { reply_markup: { inline_keyboard: kb }};
  var kbtext = "Choose a Classroom to Approve Students Membership";

  bot.sendMessage(msg.chat.id, kbtext, kbjson);
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
    if( isTeacherUser(teacher_username) )
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


function approve_inline_kb2(teacher_username, context, last_index)
{
  const kblines = 3;
  const next_index = last_index+kblines;
  const prev_index = last_index-kblines;
  var kbrd = [];
    if( isTeacherUser(teacher_username) )
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

function approve_inline_kb(teacher_username, classroom_id, last_index)
{
  const kblines = 3;
  const next_index = last_index+kblines;
  const prev_index = last_index-kblines;
  var kbrd = [];
    if( isTeacherUser(teacher_username) )
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
      var kb = approve_inline_kb(message.chat.username, data.i, 0 );
      var kbtext = "Please approve Students Membership at " + data.i + " Classroom";
      editMT(message.chat.id, message.message_id, ret.reply+"\n"+kbtext);
      editMRM(message.chat.id, message.message_id, kb);
    } else {
      bot.sendMessage(message.chat.id, ret.reply+"\nAny doubts contact Admin");
    }
  }
  else if(data.c == "ms"){ //list more students for some context
    var kb = approve_inline_kb(message.chat.username, data.i, data.n );
    editMRM(message.chat.id, message.message_id, kb);
  }
  else if(data.c == "mc"){ //list more classrooms for some context
    var kb = approve_inline_kb2(message.chat.username, data.f, data.n );
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
      var kb = approve_inline_kb(message.chat.username, data.i , 0 );
      var kbtext = "Please approve Students Membership at " + data.i + " Classroom";

      editMT(message.chat.id, message.message_id, kbtext);
      editMRM(message.chat.id, message.message_id, kb);

    } else if(data.f == "d"){ // Choose a classroom to send a reference
      var kb = classes_inline_kb3(message.chat.username, data.f, data.i , 0 );
      var kbtext = "Please choose a class from " + data.i + " Classroom to attach the reference";

      editMT(message.chat.id, message.message_id, kbtext);
      editMRM(message.chat.id, message.message_id, kb);
    }

  } else if(data.c == "cl"){ //Choose a class to some action
    if(data.f == "d"){ //Choose a class to send a reference (the classroom was already choosen)
      var kbtext = "Please, send one or more references (documents, voice messages, video/audio files or url links) to attach them to " + data.i + " Classroom";

      set_upload_files_session({teacher:message.chat.username,
	                        classroom:data.i, classpos:data.ci, timeout:2});

      console.log("upload_files_session=<"+JSON.stringify(upload_files_session)+">");

      editMT(message.chat.id, message.message_id, kbtext);

    } 
  } else if(data.c == "d"){ // Dismiss button pressed
    var kbtext = "You have successfully attached a reference to your classroom";
    editMT(message.chat.id, message.message_id, kbtext);
  }


});


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
