var express = require('express');
var router = express.Router();
var nluAnalysis;
var estimatedTime;
var totalWaitingTime;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Queue' });
});

var queueNumber;
var caseInput;
var customerName;

router.post('/successfulForm', function(req,res,next){
    queueNumber = req.body.queueNumber;
    caseInput = req.body.caseInput;
    customerName = req.body.customerName;

    //Establishing NLU Connection
    var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
    var natural_language_understanding = new NaturalLanguageUnderstandingV1({
        'username': 'cfcd5c19-ffd4-4bb4-b268-0843f3050052',
        'password': 'DIAQ8Ydmmq6j',
        'version_date': '2017-02-27'
    });
    //Passing caseInput into NLP to generate emotions and keywords
    var parameters = {
        'text': caseInput,
        'features': {
            'emotion': {},
        'keywords': {}
        }   
    }

    //running API and storing return data in nluAnalysis
    natural_language_understanding.analyze(parameters, function(err, resp) {
        if (err)
            console.log('error:', err);
        else
            nluAnalysis = resp;
    });

    //Establishing PI Connection
    var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');
    var personality_insights = new PersonalityInsightsV3({
        username: 'ccd97834-a1d7-4101-8688-b8929bcd8edd',
        password: 'bKUR4vGCkO7x',
        version_date: '2017-10-13',
        headers: {
            'X-Watson-Learning-Opt-Out': 'true'}
    });

    //Passing caseInput into Personality Insights API
    var params = {
        text: caseInput,
        consumption_preferences: true,
        raw_scores: true,
        headers:{
            'accept-language': 'en',
            'accept': 'application/json'
        }
    };
    //Establishing Database Connection
    var nano = require('nano')('https://dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix:226bb4fb93cb644526127091ab2bf0bd5f80db583b90d39acac22cdb8978c147@dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix.cloudant.com');
 
    
    personality_insights.profile(params, function(error, response){
        if(error){
            console.log('Error',error);
            //if caseInput is <100 words, store only queue number, caseInput, and keywords
            nano.db.create('queuedb', function(){
                var queuedb = nano.use('queuedb');
                queuedb.insert({
                    '_id': queueNumber,
                    'caseInput': caseInput,
                    'keywordsEmotions': nluAnalysis,
                    'customerName': customerName
                })
            })
        } else {
            var personalityAnalysis = response;
            //if caseInput is >100 words, store queue nunmber, caseInput, Personality Analysis, and keywords
            nano.db.create('queuedb', function(){
                var queuedb = nano.use('queuedb');
                queuedb.insert({
                    '_id': queueNumber,
                    'caseInput': caseInput,
                    'personalityAnalysis': personalityAnalysis,
                    'keywordsEmotions': nluAnalysis,
                    'customerName': customerName
                })
            })
        }
    })

    setTimeout(function(){
        totalWaitingTime = waitingTime();
        classifier();
        
        setTimeout(function(){
            res.redirect('successfulForm');        
            }, 4000);
    }, 3000);
});

module.exports = router;

function classifier(){
    //Establishing Connection with database
    var nano = require('nano')('https://dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix:226bb4fb93cb644526127091ab2bf0bd5f80db583b90d39acac22cdb8978c147@dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix.cloudant.com');
    var queuedb = nano.use('queuedb');
    var dataOutput, rev, text, pi, kw;
    var category;
    var suggestedUrl;
    queuedb.find({
        "selector": {
            "_id": {
                "$eq": queueNumber
            }
        }
    }, function(error, response){
        if(error){
            console.log('Error',error);
        }
        else{
            dataOutput = response;
            //saving revision id to update database later
            rev = dataOutput.docs[0]._rev;
            //storing caseInput, personality analysis and keywords in local variables
            text = dataOutput.docs[0].caseInput;
            pi = dataOutput.docs[0].personalityAnalysis;
            kw = dataOutput.docs[0].keywordsEmotions;
              
            //Establishing Classifier Connection
            var watson = require('watson-developer-cloud');
             var natural_language_classifier = watson.natural_language_classifier({
                username: 'cba77411-fa31-4a4f-bfe9-93da6f7a7a40',
                password: '0EehsRQLQBHb',
                version: 'v1'
            });
            //if caseInput is less than 1024 characters, pass entire text into classifier
            if (text.length < 1024){
                natural_language_classifier.classify({
                    text: text,
                    classifier_id: '1e0d8ex232-nlc-25846'},
                    function(err, response){
                        if(err)
                            console.log('error:', err);
                        else
                            category = response.classes[0].class_name;
                            switch(category){
                                case "Change Flight":
                                    suggestedUrl = "https://www.singaporeair.com/en_UK/plan-and-book/your-booking/managebooking/";
                                    break;
                                case "Reset Pin/Password":
                                    suggestedUrl = "https://www.singaporeair.com/kfResetPIN-flow.form?execution=e1s1";
                                    break;
                                case"Refund":
                                    suggestedUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=29155#question-29151";
                                    console.log("b"+category);
                                    break;
                                case "Miles Usage":
                                    suggestedUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=34700";
                                    break;
                                case "Luggage Claims":
                                    suggestedUrl = "https://www.singaporeair.com/en_UK/sg/travel-info/baggage/lost-mishandled-baggage/";
                                    break;
                                case "Service Complains":
                                    suggestedUrl = "https://www.singaporeair.com/en_UK/feedback-enquiry/";
                                    break;
                                case "Special Arrangements":
                                    break;
                                case "Cancellation/Delay Complains":
                                    suggestedUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=29155#question-29151";
                                    break;
                                default:
                                suggestedUrl = "https://www.singaporeair.com/en_UK/faq/";
                                    break;
                            }estimatedTime = timeEstimation(category, pi, kw);
                            exportModulesAfterCall();
                    });
            //if caseInput is >1024 characters, only pass keywords into classifier
            }else{  
                var keywds = "";
                dataOutput.docs[0].keywordsEmotions.keywords.forEach(function(item) {
                    keywds += item.text;
                });
                    natural_language_classifier.classify({
                        text: keywds,
                        classifier_id: '1e0d8ex232-nlc-25846'},
                        function(err, response){
                            if(err)
                                console.log('error:', err);
                            else{
                                category = response.classes[0].class_name;
                                switch(category){
                                    case "Change Flight":
                                        suggestedUrl = "https://www.singaporeair.com/en_UK/plan-and-book/your-booking/managebooking/";
                                        break;
                                    case "Reset Pin/Password":
                                        suggestedUrl = "https://www.singaporeair.com/kfResetPIN-flow.form?execution=e1s1";
                                        break;
                                    case"Refund":
                                        suggestedUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=29155#question-29151";
                                        break;
                                    case "Miles Usage":
                                        suggestedUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=34700";
                                        break;
                                    case "Luggage Claims":
                                        suggestedUrl = "https://www.singaporeair.com/en_UK/sg/travel-info/baggage/lost-mishandled-baggage/";
                                        break;
                                    case "Service Complains":
                                        suggestedUrl = "https://www.singaporeair.com/en_UK/feedback-enquiry/";
                                        break;
                                    case "Special Arrangements":
                                        break;
                                    case "Cancellation/Delay Complains":
                                        suggestedUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=29155#question-29151";
                                        break;
                                    default:
                                    suggestedUrl = "https://www.singaporeair.com/en_UK/faq/";
                                        break;
                                }estimatedTime = timeEstimation(category, pi, kw);
                                exportModulesAfterCall();
                            }
                        }
                    );
                }
        }
    })


    function exportModulesAfterCall(){
        module.exports.suggestedUrl = suggestedUrl;
        queuedb.insert({
            '_id': queueNumber,
            '_rev': rev,
            'caseInput': text,
            'personalityAnalysis': pi,
            'keywordsEmotions': kw,
            'category': category,
            'estimatedTime': estimatedTime,
            'customerName': customerName
        });
    }

}

function timeEstimation(category, pi, kw){
  switch(category){
    case "Change Flight":
        CategoryBaseTime = 60;
        break;
    case "Reset Pin/Password":
        CategoryBaseTime = 6;
        break;
    case"Refund":
        CategoryBaseTime = 20;
        break;
    case "Miles Usage":
        CategoryBaseTime = 10;
        break;
    case "Luggage Claims":
        CategoryBaseTime = 45;
        break;
    case "Service Complains":
        CategoryBaseTime = 45;
        break;
    case "Special Arrangements":
        CategoryBaseTime = 20;
        break;
    case "Cancellation/Delay Complains":
        CategoryBaseTime = 45;
        break;
    default:
    CategoryBaseTime = 30;
        break;
  }
  var er, co, ag, ex, op, st, id, pr, ang;
  var count = require('word-count');
  if(count(caseInput)<100){
    er = co = ag = ex = op = st = id = pr = 0.5

  }else{
    er = pi.personality[4].percentile;  //emotional range
    co = pi.personality[1].percentile; //conscientiousness
    ag = pi.personality[3].percentile; //agreeableness
    ex = pi.personality[2].percentile; //extraversion
    op = pi.personality[0].percentile; //openness
    st = pi.needs[10].percentile; //structured
    id = pi.needs[5].percentile; //ideal
    pr = pi.needs[8].percentile; //practicality
  }
  ang=kw.emotion.document.emotion.anger;//anger

  var emotionalMultiplier = er*5 + (1-co)*7 + (1-ag)*10 + er*4 + (1-op)*9 + (1-st)*3 + (1-st)*3 + id*7 + (1-pr)*5 + ang*7;
  var totalTime = CategoryBaseTime * emotionalMultiplier/57 * 2;
  ;
    return totalTime;
}

function waitingTime(){
    var nano = require('nano')('https://dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix:226bb4fb93cb644526127091ab2bf0bd5f80db583b90d39acac22cdb8978c147@dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix.cloudant.com');
    var queuedb = nano.use('queuedb');
    var sum= 0;
    var canReturn = false;
    queuedb.find({
        "selector": {
            "_id": {
                "$lt": queueNumber
            }
        }
    }, function(err, resp){
        if(err){
            console.log(err); 
        }else{
            var output = resp;
            output.docs.forEach(function(item) {
                sum += parseInt(item.estimatedTime);
            });
        }
    });
    setTimeout(function(){
        sum = parseInt(sum/10);
        module.exports.ewt = sum;
        return sum;
    }, 3000);
    
}