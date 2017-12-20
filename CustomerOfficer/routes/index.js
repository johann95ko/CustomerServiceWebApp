var express = require('express');
var router = express.Router();
var fileUrl;
//Fetching information from database
var nano = require('nano')('https://dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix:226bb4fb93cb644526127091ab2bf0bd5f80db583b90d39acac22cdb8978c147@dd3002ae-f103-4f75-a72d-08d3bca9bf63-bluemix.cloudant.com');
var queuedb = nano.use('queuedb');
var queueno = "1001";
var outputDB;
var outputCase;
var fileOption;
var outputCat;
var outputName;
var outputAnger;

/* GET home page. */
router.get('/index/:id', function(req,res,next){
    console.log(req.params.id);
    queueno = req.params.id;
    pageLoad();
    console.log(outputName);
    res.render('index',{title: 'Customer Officer Interface', 
        name: outputName,
        data: outputDB,
        cat: outputCat,
        caseData: outputCase,
        anger: outputAnger,
        url: fileUrl, 
        output: req.params.id})

})

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


function pageLoad() {
    console.log(queueno);
    queuedb.find({
            "selector": {
                "_id": {
                    "$eq": queueno
                }
            },
            "fields": ["personalityAnalysis"]
        }, function (error, response) {
            if (error) {
                console.log('Error', error);
            }
            else {
                outputDB = response;
            }
        }
    )

    queuedb.find({
            "selector": {
                "_id": {
                    "$eq": queueno
                }
            },
            "fields": ["caseInput"]
        }, function (error, response) {
            if (error) {
                console.log('Error', error);
            }
            else {
                outputCase = response;
            }
        }
    )
    //fileOption = require('./index.js').fileOption;
    queuedb.find({
        "selector": {
            "_id": {
                "$eq": queueno
            }
        }
        },function (error, response) {
            if (error) {
                console.log('Error', error);
            }
            else {
                outputCat = response.docs[0].category;
                outputAnger = response.docs[0].keywordsEmotions.emotion.document.emotion.anger;
                console.log(outputAnger);
            }
        }
    )
    queuedb.find({
        "selector": {
            "_id": {
                "$eq": queueno
            }
        }
        },function (error, response) {
            if (error) {
                console.log('Error', error);
            }
            else {
                outputName = response.docs[0].customerName;
            }
        }
    )   
    fileOption = outputCat;
    console.log(fileOption);
    switch (fileOption) {
        case "Change Flight":
            fileUrl = "/changeFlight";
            break;
        case "Reset Pin/Password":
            fileUrl = "/resetPin";
            break;
        case"Refund":
            fileUrl = "/refund";
            break;
        case "Miles Usage":
            fileUrl = "/milesUsage";
            break;
        case "Luggage Claims":
            fileUrl = "/luggageFiles";
            break;
        case "Service Complains":
            fileUrl = "/complains";
            break;
        case "Special Arrangements":
            fileUrl = "/special";
            break;
        case "Cancellation/Delay Complains":
            fileUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=29155#question-29151";
            break;
        default:
            fileUrl = "https://www.singaporeair.com/en_UK/sg/faqCategory/?category=29155#question-29151";
            break;
    }
    console.log("db"+JSON.stringify(outputDB));
    console.log("case"+JSON.stringify(outputCase));
    console.log("url"+fileUrl);
}
    /* GET home page. */
    router.get('/', function (req, res, next) {
        res.render('officer', {
            title: 'Customer Officer Interface',
            data: outputDB,
            caseData: outputCase,
            url: fileUrl, output: req.params.id
        });
        data = outputDB;
        caseData = outputCase;
        console.log(JSON.stringify(data, null, 2));
        console.log(caseData);
        console.log(fileOption);
    });

module.exports = router;








