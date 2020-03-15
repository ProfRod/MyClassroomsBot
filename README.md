# MyClassroomsBot (@myclassrooms_bot) #


### What is MyClassroomsBot? ###

MyClassroomsBot is a quick way to organize your classes and the communication with your students, using a Telegram bot.

It currently supports:
* Up to three profiles: Admin, Teacher and Student
* For teacher profile:
  * Manage Multiple classrooms;
  * Organize your classrooms per class;
  * Attach studies references to your classes;
* For student profile
  * Join to multiple classrooms;
  * Automatically receive new references sent by the teacher; 
  * Check manually for new references sent by the teacher;

The following features are planned to be added in the near future:
* Add Polls feature
* Tasks manager for teacher to send tasks to the students and also receive the deliverables from the students
* Student Assessment 

## How do I get set up? ###

Download and install Node.js

https://nodejs.org/en/download/

Clone or download this repository

### Configuring config.json ###

First rename config-example.json to config.json:
```
$ mv config-example.json config.json
```
Open `config.json` with your favorite text editor

Specify your Telegram Bot's token (See steps below how to create a Telegram Bot)

```
"token": "<INSERT TOKEN HERE>"
```

### Configuring Database json files ###

Rename json files located at database directory
```
$ cd data/
$ mv adminusers.json-example adminusers.json
$ mv studentusers.json-example studentusers.json
$ mv teacherusers.json-example teacherusers.json
$ mv classrooms.json-example classrooms.json
$ mv references.json-example references.json
```

### How to get Telegram Token

Talk to the BotFather https://telegram.me/botfather

Write /newbot and follow the instructions

You should get your token like this:
```
Use this token to access the HTTP API:
999999999:AAFxmfas0yOKSnDaAgAierd90-v9h_LJeF9
```

### First time run

Don't forget to install Node.js

Open up your command prompt or terminal and navigate to your directory

Navigate to your directory using 

```
cd *your directory*
for example:
cd /home/user/MyClassroomsBot
```

Then, run these commands

```
npm install
npm start
```

npm install will install required dependancies for this script and npm start will run it.


Add your telegram username in the adminusers.json file in the data folder in order to start using the Bot. At least 1 user should be an admin to be able to manage the bot. Unauthorized users will not be able to access the Bot's features and only Admins can give other users access.


## Available commands ###

```
Generic commands:
/myclassrooms - List of all your classrooms
/join <classroom_id> - Join a classroom
/exit <classroom_id> - Exit a classroom

Teacher commands:
/new <classroom name> - Create new classroom
/approve <classroom name> <student username> - Approve student joining in the classroom
/addstd <classroom name> <student username> - Add a Student
/delstd <classroom name> <student username> - Remove a student from the classroom
/addclass <classroom name> <yyyy-mm-dd> <\"class name\"> <\"class subject\"> - Add a class in classromm>
/delclass <class name> <class date yyyy-mm-dd> <\"class subject\"> - Remove a class in classromm>

Admin commands:
/admins - List of admin users
/addadmin <username> - Add user as admin
/deladmin <username> - Remove an admin user
/teachers - List of teacher users
/addteacher <username> - Add username as teacher user
/delteacher <username> - Remove username as teacher user
/students - List of students users
```
