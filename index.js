var Alexa = require('alexa-sdk');
var base64 = require('base-64');
var urlencode = require('urlencode');
var request = require('request');
var P = require('piazza-api');

var app_ID = "amzn1.ask.skill.9423b11b-dad6-443b-a857-64aa5677d3c3",
    courseName,
    courses = ["cs five two two", "cs five twenty two", "cs five hundred twenty two", "cs five hundred and twenty two", "hci", "human computer interaction", "cs four seven seven", "cs four seventy seven", "cs four hundred seventy seven", "cs four hundred and seventy seven", "ethics in computing"],
    stage,
    numberOfQuestions,
    questions = [],
    questionsLeft,
    answer,
    datum,
    task,
    note_question,
    courseID,
    postTitle,
    postContent,
    invisibility,
    bypass,
    grades = {"CS 522": {hw3: {value: 100, average: 77, median: 94}, overall: {value: 94.16, average: 83.14, median: 89.15}}, "CS 477": {final: {value: 96, average: 81, median: 83}, overall: {value: 96, average: 78, median: 81}}},
    overall_hw,
    due_yesno,
    professor,
    hw;

var encrypt = function(plaintext, shiftAmount) {
    var ciphertext = "";
    for(var i = 0; i < plaintext.length; i++) {
        var plainCharacter = plaintext.charCodeAt(i);
        if(plainCharacter >= 97 && plainCharacter <= 122) {
            ciphertext += String.fromCharCode((plainCharacter - 97 + shiftAmount) % 26 + 97);
        } else if(plainCharacter >= 65 && plainCharacter <= 90) {
            ciphertext += String.fromCharCode((plainCharacter - 65 + shiftAmount) % 26 + 65);
        } else {
            ciphertext += String.fromCharCode(plainCharacter);
        }
    }
    return ciphertext;
}
var decrypt = function(ciphertext, shiftAmount) {
    var plaintext = "";
    for(var i = 0; i < ciphertext.length; i++) {
        var cipherCharacter = ciphertext.charCodeAt(i);
        if(cipherCharacter >= 97 && cipherCharacter <= 122) {
            plaintext += String.fromCharCode((cipherCharacter - 97 - shiftAmount + 26) % 26 + 97);
        } else if(cipherCharacter >= 65 && cipherCharacter <= 90) {
            plaintext += String.fromCharCode((cipherCharacter - 65 - shiftAmount + 26) % 26 + 65);
        } else {
            plaintext += String.fromCharCode(cipherCharacter);
        }
    }
    return plaintext;
}

const pass = decrypt('ktktgwhroxwndtvanwwtf', 19);

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.appId = app_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {

    'CheckUnansweredIntent': function() {
        task = 'unanswered';
        courseName = this.event.request.intent.slots.course.value;
        //create();
        if(!courseName){
            this.emit('CoursePromptHelper');
        }
        else{
            var courseIndex = courses.indexOf(courseName.toLowerCase());
            if(courseIndex==-1){
                stage = 'invalid course';
                this.emit('CoursePromptHelper');
            }
            else{
                courseName = ((courseIndex>=0)&&(courseIndex<=5)) ? "CS 522" : "CS 477";
                if(courseName=="CS 522"){
                    questions = datum.classes[0].unanswered;
                }
                else{
                    questions = datum.classes[1].unanswered
                }
                numberOfQuestions = questions.length;
                questionsLeft = numberOfQuestions;
                this.emit('TellQuestionsHelper');
            }
        }
    },
    
    'PostIntent': function () {
        task = 'post';
        courseName = this.event.request.intent.slots.course.value;
        note_question = this.event.request.intent.slots.note_question.value;
        if(note_question){
            if(note_question.toLowerCase().search('question')!=-1){
                note_question = 'question';
            }
            else if(note_question.toLowerCase().search('note')!=-1){
                note_question = 'note';    
            }
        }
        if(!courseName){
            this.emit('CoursePromptHelper');
        }
        else{
            var courseIndex = courses.indexOf(courseName.toLowerCase());
            if(courseIndex==-1){
                stage = 'invalid course';
                this.emit('CoursePromptHelper');
            }
            else{
                courseName = ((courseIndex>=0)&&(courseIndex<=5)) ? "CS 522" : "CS 477";
                if(courseName=="CS 522"){
                    courseID = 'ixj6p2sfuzp3tm';
                }
                else{
                    courseID = 'izw0auv6f2c6fp';
                }
                this.emit('QuestionNoteHelper');
            }
        }
    },
    
    'NoteIntent': function () {
        if((stage='no note question')&&(task=='post')){
            note_question = 'note';
            this.attributes['speechOutput'] = 'Alright, tell me the title of the note.';
            stage = 'ask for title';
            this.emit(':ask', this.attributes['speechOutput']);
        }
    },
    
    'QuestionIntent': function () {
        if((stage='no note question')&&(task=='post')){
            note_question = 'question';
            this.attributes['speechOutput'] = 'Alright, tell me the title of the question.';
            stage = 'ask for title';
            this.emit(':ask', this.attributes['speechOutput']);
        }
    },
    
    'VisibleIntent': function () {
        if((stage='ask for visibility')&&(task=='post')){
            invisibility = 'no';
            this.emit('PostVerifyHelper');
        }
    },
    
    'AnonymousCMIntent': function () {
        if((stage='ask for visibility')&&(task=='post')){
            invisibility = 'stud';
            this.emit('PostVerifyHelper');
        }
    },

    'AnonymousIntent': function () {
        if((stage='ask for visibility')&&(task=='post')){
            invisibility = 'full';
            this.emit('PostVerifyHelper');
        }
    },

    
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
    },
    
    'AMAZON.HelpIntent': function () {
        this.attributes['speechOutput'] = 'Using Whiteboard, you can ask Alexa things like, "Post a note in CS 522", "What are the unanswered questions in HCI?", "What is my grade in CS 477?" and get answers instantly! You can get started anytime by saying "Ask Whiteboard"';
        this.emit(':tellWithCard', this.attributes['speechOutput'], 'Whiteboard Help', this.attributes['speechOutput']);
    },
    
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    
    'SessionEndedRequest':function () {
        this.emit(':tell', 'Okay, bye!');
    },
    
    'ListenerIntent': function () {
        if((stage=='listenforanswer')&&(task=='unanswered')){
            answer = this.event.request.intent.slots.mirror_text.value;
            stage = 'isanswercorrect';
            this.emit(":ask",'You said: '+ answer+' Is this correct?');
        }
        else if((stage=='ask for title')&&(task=='post')){
            postTitle = this.event.request.intent.slots.mirror_text.value;
            this.attributes['speechOutput'] = 'I got you, tell me the contents of the '+note_question;
            stage = 'ask for content';
            this.emit(":ask", this.attributes['speechOutput']);
        }
        else if((stage=='ask for content')&&(task=='post')){
            postContent = this.event.request.intent.slots.mirror_text.value;
            this.attributes['speechOutput'] = 'Okay, how do you want to post, visible to everyone, anonymous to classmates, anonymous to everyone?';
            if(bypass){
                this.emit('PostVerifyHelper');
            }
            else{
                stage = 'ask for visibility';
                this.emit(":ask", this.attributes['speechOutput']);
            }
        }
    },
    
    'HCIIntent': function () {
        courseName = 'CS 522';
        if(task=='unanswered'){
            this.emit('CourseNameFinder');
        }
        else if(task=='post'){
            this.emit('QuestionNoteHelper');    
        }
        else if(task=='grades'){
            this.emit('GetHWHelper');
        }
        else if((task=='availability')&&(due_yesno)){
            this.emit('DueHelper');
        }
        else if(task=='availability'){
            this.emit('AvailabilityHelper');
        }
    },
    
    'EthicsIntent': function () {
        courseName = 'CS 477';
        if(task=='unanswered'){
            this.emit('CourseNameFinder');
        }
        else if(task=='post'){
            this.emit('QuestionNoteHelper');       
        }
        else if(task=='grades'){
            this.emit('GetHWHelper');
        }
        else if((task=='availability')&&(due_yesno)){
            this.emit('DueHelper');
        }
        else if(task=='availability'){
            this.emit('AvailabilityHelper');
        }
    },
    
    'CoursePromptHelper' : function () {
        if(stage == 'invalid course'){
            this.attributes['speechOutput'] = 'I didn\'t quite get that. Which course do you want, CS 522 or CS 477?';
        }
        else{
            if(task=='unanswered'){
                this.attributes['speechOutput'] = 'Which course are you referring to? You are teaching CS 522, Human Computer Interaction and CS 422, User Interface Design and Programming.';
            }
            else{
                this.attributes['speechOutput'] = 'Which course are you referring to? You are registered in CS 522, Human Computer Interaction and CS 477, Ethics in Computing.';
            }
        }
        if(task!='availability'){
            stage = 'no course name';
        }
        this.attributes['repromptSpeech'] = 'Which course do you want, CS 522 or CS 477?';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
    },
    
    'QuestionNoteHelper': function () {
        if(note_question){
            this.attributes['speechOutput'] = 'Alright, tell me the title of the '+note_question;
            stage = 'ask for title';
            this.emit(':ask', this.attributes['speechOutput']);
        }
        else{
            stage = 'no note question';
            this.attributes['speechOutput'] = 'What do you want to post, note or question?';
            this.emit(':ask', this.attributes['speechOutput']);
        }
    },
    
    'PostVerifyHelper': function () {
        stage = 'post verify';
        this.emit(':askWithCard', 'The title of the '+note_question+' is '+postTitle+', and the contents of the '+note_question+' are '+postContent+'. Is this correct?', 'Is this correct?', 'Review post', ('Title of the '+note_question+': '+postTitle+'\nContents of the '+note_question+': '+postContent));
    },
    
    'CourseNameFinder': function () {
        if((stage=='no course name')&&(task=='unanswered')){
            stage = undefined;
            if(courseName=="CS 522"){
                questions = datum.classes[0].unanswered;
            }
            else{
                questions = datum.classes[1].unanswered;
            }
            numberOfQuestions = questions.length;
            questionsLeft = numberOfQuestions;
            this.emit('TellQuestionsHelper');
        }
    },
    
    'ReadAloudIntent': function () {
        if(task=='unanswered'){
            if(numberOfQuestions == undefined){
                this.attributes['speechOutput'] = 'Sorry, the server is unavailable right now. Try again later.';
                this.emit(':tell', this.attributes['speechOutput']);
            }
            else{
                this.emit('ReadAloudHelper');
            }
        }
        else if(task=='grades'){
            if(overall_hw=='overall'){
                this.attributes['speechOutput'] = 'You got '+grades[courseName].overall.value+' percent in '+courseName+'. The class average is '+grades[courseName].overall.average+' percent and the median is '+grades[courseName].overall.median+' percent';
            }
            else{
                this.attributes['speechOutput'] = 'You got '+grades[courseName][overall_hw].value+' over hundred in '+courseName+'. The class average is '+grades[courseName][overall_hw].average+' and the median is '+ grades[courseName][overall_hw].median;
            }
            this.emit(':tell', this.attributes['speechOutput']);
        }
    },
    
    'SendToMobileIntent': function () {
        if(task=='unanswered'){
            this.attributes['speechOutput'] = 'I sent your questions to your mobile phone. Goodbye!';
            var questions_card = '';
            questions.forEach(function(d, i){
                var author_name = (d.author)?(d.author):'Anonymous';
                questions_card += ((i+1)+ '. ' + (d.content.replace(/Â/g,"")) + '\n- '+ author_name + ' \n');
            });
            this.emit(':tellWithCard', this.attributes['speechOutput'], 'Unanswered Questions in '+ courseName, questions_card);
        }
        else if(task=='grades'){
            this.attributes['speechOutput'] = 'Okay. I sent the grades to your mobile phone.';
            if(overall_hw=='overall'){
                this.emit(':tellWithCard', this.attributes['speechOutput'], courseName+' '+convertOverallHW(overall_hw)+' Grades', 'Your Score: '+ grades[courseName].overall.value+'%\nClass Average: '+grades[courseName].overall.average+'%\nClass Median: '+grades[courseName].overall.median+'%');
            }
            else{
                this.emit(':tellWithCard', this.attributes['speechOutput'], courseName+' '+convertOverallHW(overall_hw)+' Grades', 'Your Score: '+ grades[courseName][overall_hw].value +'/100\nClass Average: '+grades[courseName][overall_hw].average+'\nClass Median: '+grades[courseName][overall_hw].median);
            }
        }
    },
    
    'TellQuestionsHelper' : function () {
        if(task=='unanswered'){
            if(numberOfQuestions == 0){
                this.attributes['speechOutput'] = 'You don\'t have unanswered questions in '+courseName+'. Goodbye!';
                this.emit(':tell', this.attributes['speechOutput']);
            }
            else if(numberOfQuestions == 1){
                this.attributes['speechOutput'] = 'You have one unanswered question in '+courseName+'. Do you want me to read it aloud or send it to your mobile phone?';
                this.attributes['repromptSpeech'] = 'Do you want me to read aloud or send to your mobile?';
                this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
            }
            else if(numberOfQuestions > 1){
                this.attributes['speechOutput'] = 'You have '+numberOfQuestions+' unanswered questions in '+courseName+'. Do you want me to read them aloud or send them to your mobile phone?';
                this.attributes['repromptSpeech'] = 'Do you want me to read aloud or send to your mobile?';
                this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
            }
            else{
                this.attributes['speechOutput'] = 'Sorry, the server is unavailable right now. Try again later.';
                this.emit(':tell', this.attributes['speechOutput']);
            }    
        }
    },
    
    'ReadAloudHelper' : function () {
        if(task=='unanswered'){
            if(numberOfQuestions == 1){
                if(questionsLeft == 1){
                    this.attributes['speechOutput'] = 'Here is the question';
                    var author_name = (questions[0].author)?(questions[0].author):'Anonymous';
                    this.attributes['speechOutput'] += (author_name+' asked: '+(questions[0].content.replace(/[\nÂ]/g,"")) + ' .');
                    this.attributes['speechOutput'] += 'Do you want to answer this question?';
                    stage = 'answeryesno';
                    this.emit(':ask', this.attributes['speechOutput']);
                }
                else if((questionsLeft == 0)&&(stage == 'posted answer')){
                    this.attributes['speechOutput'] = 'Your answer has been successfully posted. Great work! Goodbye!';
                    this.emit(':tell', this.attributes['speechOutput']);
                }
                else if((questionsLeft == 0)&&(stage == 'dontanswer')){
                    this.attributes['speechOutput'] = 'Okay, I got you. Goodbye!';
                    this.emit(':tell', this.attributes['speechOutput']);
                }
            }
            else if (numberOfQuestions > 1){
                if(questionsLeft == numberOfQuestions){
                    this.attributes['speechOutput'] = 'Here is the first question';
                    var author_name = (questions[0].author)?(questions[0].author):'Anonymous';
                    this.attributes['speechOutput'] += (author_name+' asked: '+(questions[0].content.replace(/[\nÂ]/g,"")) + ' .');
                    this.attributes['speechOutput'] += 'Do you want to answer this question?';
                    stage = 'answeryesno';
                    this.emit(':ask', this.attributes['speechOutput']);
                }
                else if((questionsLeft == 0)&&(stage == 'posted answer')){
                    this.attributes['speechOutput'] = 'Your answer has been successfully posted. You went through all of the unanswered questions. Great work! Goodbye!';
                    this.emit(':tell', this.attributes['speechOutput']);
                }
                else if((questionsLeft == 0)&&(stage == 'dontanswer')){
                    this.attributes['speechOutput'] = 'Alright. You went through all of the unanswered questions. Great work! Goodbye!';
                    this.emit(':tell', this.attributes['speechOutput']);
                }
                else if((questionsLeft > 0)&&(stage == 'posted answer')){
                    this.attributes['speechOutput'] = 'Your answer has been successfully posted. Here\'s the next question';
                    var author_name = (questions[numberOfQuestions-questionsLeft].author)?(questions[numberOfQuestions-questionsLeft].author):'Anonymous';
                    this.attributes['speechOutput'] += (author_name+' asked: '+(questions[numberOfQuestions-questionsLeft].content.replace(/[\nÂ]/g,"")) + ' .');
                    this.attributes['speechOutput'] += 'Do you want to answer this question?';
                    stage = 'answeryesno';
                    this.emit(':ask', this.attributes['speechOutput']);
                }
                else if((questionsLeft > 0)&&(stage == 'dontanswer')){
                    this.attributes['speechOutput'] = 'Okay, I got you. Here\'s the next question';
                    var author_name = (questions[numberOfQuestions-questionsLeft].author)?(questions[numberOfQuestions-questionsLeft].author):'Anonymous';
                    this.attributes['speechOutput'] += (author_name+' asked: '+(questions[numberOfQuestions-questionsLeft].content.replace(/[\nÂ]/g,"")) + ' .');
                    this.attributes['speechOutput'] += 'Do you want to answer this question?';
                    stage = 'answeryesno';
                    this.emit(':ask', this.attributes['speechOutput']);
                }
            }
        }
    },
    
    'AMAZON.YesIntent' : function () {
        if(task=='unanswered'){
            if(stage == 'answeryesno'){
                stage = 'listenforanswer';
                this.emit(':ask', 'Go ahead, I\'m listening.');
            }
            else if(stage == 'isanswercorrect'){
                stage = 'posted answer';
                rep(courseID, questions[numberOfQuestions-questionsLeft].id, answer);
                questionsLeft--;
                this.emit('ReadAloudHelper');
            }
        }
        else if((stage == 'post verify')&&(task=='post')){
            if(note_question=='note'){
                postn(courseID, postTitle, postContent, {'anonymous': invisibility});
            }
            else if(note_question=='question'){
                postq(courseID, postTitle, postContent, {'anonymous': invisibility});
            }
            this.emit(':tell', 'Your '+note_question+' has been posted. Goodbye!');
        }
    },
    
    'AMAZON.NoIntent' : function () {
        if(task=='unanswered'){
            if(stage == 'answeryesno'){
                questionsLeft--;
                stage = 'dontanswer';
                this.emit('ReadAloudHelper');
            }
            else if(stage == 'isanswercorrect'){
                stage = 'listenforanswer';
                this.emit(':ask', 'Alright, I\'m listening. Tell me the answer again.');
            }
        }
        else if((stage == 'post verify')&&(task=='post')){
            bypass = true;
            this.attributes['speechOutput'] = 'Alright, tell me the title of the '+note_question+' again';
            stage = 'ask for title';
            this.emit(':ask', this.attributes['speechOutput']);
        }
    },
    
    'CheckGradesIntent' : function () {
        task = 'grades';
        overall_hw = this.event.request.intent.slots.overall.value;
        courseName = this.event.request.intent.slots.course.value;
        hw = this.event.request.intent.slots.homework.value;
        if(overall_hw){
            if(overall_hw.toLowerCase().search('overall')!=-1){
                overall_hw = 'overall';
            }
        }
        else{
            overall_hw = undefined;
            if(hw){
                if(hw.toLowerCase().search('home')!=-1){
                    overall_hw = 'hw3';
                }
                else if(hw.toLowerCase().search('final')!=-1){
                    overall_hw = 'final';
                }
            }   
        }
        if(!courseName){
            this.emit('CoursePromptHelper');
        }
        else{
            var courseIndex = courses.indexOf(courseName.toLowerCase());
            if(courseIndex==-1){
                stage = 'invalid course';
                this.emit('CoursePromptHelper');
            }
            else{
                courseName = ((courseIndex>=0)&&(courseIndex<=5)) ? "CS 522" : "CS 477";
                this.emit('GetHWHelper');
            }
        }
    },
    
    'GetHWHelper' : function () {
        if(!overall_hw){
            if(courseName=='CS 522'){
                this.attributes['speechOutput'] = 'Okay. Homework 3 is recently graded. Do you want the grade for homework 3 or overall grade?';
                this.attributes['repromptSpeech'] = 'Which one do you want, homework 3 grade or overall grade?';
                stage = 'no overall hw';
                this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
            }
            else if(courseName=='CS 477'){
                this.attributes['speechOutput'] = 'Okay. Final exam is recently graded. Do you want final exam grade or overall grade?';
                this.attributes['repromptSpeech'] = 'Which one do you want, final exam grade or overall grade?';
                stage = 'no overall hw';
                this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
            }
        }
    },
    
    'OverallIntent' : function () {
        overall_hw = 'overall';
        this.emit('ReadSendHelper');
    },
    
    'HWIntent' : function () {
        if(courseName == 'CS 522'){
            overall_hw = 'hw3';
        }
        else if(courseName == 'CS 477'){
            overall_hw = 'final';
        }
        this.emit('ReadSendHelper');
    },
    
    'ReadSendHelper' : function () {
        this.attributes['speechOutput'] = 'Sure, shall I read your grades aloud or send them to your mobile phone?';
        this.attributes['repromptSpeech'] = 'Do you want me to read your grades aloud or send to your mobile?';
        this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech']);
    },
    
    'AvailabilityIntent' : function() {
        task = 'availability';
        due_yesno = this.event.request.intent.slots.due.value;
        courseName = this.event.request.intent.slots.course.value;
        professor = this.event.request.intent.slots.professor.value;
        hw = this.event.request.intent.slots.homework.value;
        if(due_yesno){
            if(!courseName){
                this.emit('CoursePromptHelper');
            }
            else{
                var courseIndex = courses.indexOf(courseName.toLowerCase());
                if(courseIndex==-1){
                    stage = 'invalid course';
                    this.emit('CoursePromptHelper');
                }
                else{
                    courseName = ((courseIndex>=0)&&(courseIndex<=5)) ? "CS 522" : "CS 477";
                    this.emit('DueHelper');
                }
            }    
        } 
        else{
            if(professor){
                if(hw){
                    this.emit(':tell', 'Professor Debaleena recently posted homework 3, it is due April fourth before midnight.');
                }
                else{
                    this.emit(':tell', 'Professor Debaleena didn\'t post any new content');
                }
            }
            else{
                if(!courseName){
                    this.emit('CoursePromptHelper');
                }
                else{
                    var courseIndex = courses.indexOf(courseName.toLowerCase());
                    if(courseIndex==-1){
                        stage = 'invalid course';
                        this.emit('CoursePromptHelper');
                    }
                    else{
                        courseName = ((courseIndex>=0)&&(courseIndex<=5)) ? "CS 522" : "CS 477";
                        this.emit('AvailabilityHelper');
                    }
                }
            }
        }
    },
    
    'DueHelper': function () {
        if(courseName=='CS 522'){
            this.emit(':tell', 'You have final website due on May 5 before midnight for CS 522, Human Computer Interaction.');
        }
        else{
            this.emit(':tell', 'You don\'t have anything due for CS 477, Ethics in Computing.');
        }
    },
    
    'AvailabilityHelper': function () {
        if(hw){
            if(courseName=='CS 522'){
                this.emit(':tell', 'Homework 3 is recently posted for CS 522, Human Computer Interaction. It is due April fourth before midnight.');
            }
            else{
                this.emit(':tell', 'There is no new homework available for CS 477, Ethics in Computing.');
            }
        }
        else{
            if(courseName=='CS 522'){
                this.emit(':tell', 'There is no new content available for CS 522, Human Computer Interaction.');
            }
            else{
                this.emit(':tell', 'There is no new content available for CS 477, Ethics in Computing.');
            }
        }
    },
    
};    

function convertOverallHW(somestr){
    if(somestr=='final'){
        return 'Final Exam';
    }
    else if(somestr=='hw3'){
        return 'Homework 3';
    }
    else if(somestr=='overall'){
        return 'Overall';
    }
}

function rep(cid,conid,matter){
    P.login('spandu3@uic.edu', pass).then((user)=>{
        user.getClassByID(cid).getContentByID(conid).then((e)=>{
            P.login('spandu3@uic.edu', pass).then((user)=>{
                //user.answerQuestion(e,matter).then((data)=>{console.log(data);});
                console.log("reply posted");
            })
        });
    });
}

function postq(cid,summary,ques,options){
    P.login('spandu3@uic.edu', pass).then((user)=>{
        //user.postQuestion(cid,summary,ques,options).then((data)=>{console.log(data);});
        console.log("question posted");
    });
}

function postn(cid,summary,ques,options){
    P.login('spandu3@uic.edu', pass).then((user)=>{
        //user.postNote(cid,summary,ques,options).then((data)=>{console.log(data);});
        console.log("note posted");
    });
}

function create(){
    var t = {};
    P.login('spandu3@uic.edu', pass).then((user)=>{
        t.name=user.name;
        console.log("this is t name " + t.name+ " this is user name " + user.name);
        var tempClass = user.getClassesByRole('student').filter((d)=>{if(d.status=='active' && d.term=='Spring 2017') return true;});
        t.classes=[];
        tempClass.forEach((l)=>{
            var cl = {};
            cl.id = l.id;
            cl.name=l.name;
            cl.courseNumber = l.courseNumber;
            cl.iname = l.instructors.filter((d)=>{return d.role=="professor";});
            cl.iname = cl.iname[0].name;
            cl.schoolname= l.school.name;
            t.classes.push(cl);
        });
        t.classes.forEach((k)=>{
            var unans=[];
            user.getClassByID(k.id).filterByProperty('unanswered').then((data)=>{
            data.forEach((d)=>{
                d.toContent().then((g)=>{
                    var h = {};
                    h.id = g.id;
                    h.classID = g.classID;
                    h.title=g.title;
                    h.content=g.content.replace(/<\/?[^>]+(>|$)/g, "");
                    h.content = h.content.replace(/[ÀÁÂÃÄÅ]/g, "");
                    h.created = g.created;
                    g.getAuthor().then((dat)=>{h.author = dat;});
                    unans.push(h);
                }).catch((error)=>{
                    console.log('Uh oh, there was an error:', error);
                });
            });
            }).catch((error)=>{
                console.log('Uh oh, there was an error:', error);
            });
            k.unanswered=unans;
        });
    datum = t;
    }).catch((error)=>{
        console.log('Uh oh, there was an error:', error);
    });
    console.log("this is in create " + JSON.stringify(datum));
}

var datum = {
    "name": "Sumanth Reddy Pandugula",
    "classes": [{
        "id": "ixj6p2sfuzp3tm",
        "name": "Human-Computer Interaction",
        "courseNumber": "CS 522",
        "iname": "Debaleena Chattopadhyay",
        "schoolname": "University of Illinois at Chicago",
        "unanswered": [{
            "id": "j0zkjli5sif62w",
            "classID": "ixj6p2sfuzp3tm",
            "title": "HW3 Regression Coefficient",
            "content": "Does anyone know how we calculate the regression coefficient?",
            "created": "2017-04-01T18:05:40Z"
        }, {
            "id": "j0bln3559sm5i8",
            "classID": "ixj6p2sfuzp3tm",
            "title": "Submission guidelines",
            "content": "Hi,Â \n\nI was wondering how and when we will be submitting the requirement document and the sketching diary. The diary is to be submitted in class and the requirement document on blackboard before midnight?Â \n\nThanks!",
            "created": "2017-03-15T23:29:54Z"
        }, {
            "id": "j0ztdyequfc1cv",
            "classID": "ixj6p2sfuzp3tm",
            "title": "Shannon&#39;s formula",
            "content": "In Shannon&#39;s formulation of Fitts law, the distance parameter in the numerator is the total distance that the user has to travel to click and not the distance that we will specify for the target. Is my understanding correct ?\n\n\n",
            "created": "2017-04-01T22:13:13Z"
        }]
    }, {
        "id": "iy28cp269eh7a9",
        "name": "Public Policy, Legal, & Ethical Issues in Computing, Privacy, and Security",
        "courseNumber": "CS 477",
        "iname": "Robert Sloan",
        "schoolname": "Chicago-Kent",
        "unanswered": []
    }]
};
