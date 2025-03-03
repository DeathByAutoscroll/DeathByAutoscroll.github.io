/* The Unofficial Case Analysis Toolkit */
var version = "v1.6";
/*
Script created by: DeathByAutoscroll.
Date created: 2nd of January, 2025.
Last edit that updated this comment: 18:38 on the 3rd of March, 2025.
*/

/* USER OPTIONS */

/* Toolkit */
var displayEmptyCategories = false; /* Shows all categories, even if there are no results. */

/* Fades */
var hideZeroDurationFade = false; /* Fades of 0ms won't appear in the results. */

/* Merged profiles*/
var mergeProfileIdFilter = 0; /* 0 = No filter */
var ignoreSetSpeaker = true; /* Ignores non auto voices if true */

/* END OF OPTIONS */

var lastCategory = "";
var categoryStrings = [
  {name:"DNTblue", text:"Do not talk not set on blue text.", displayed:false},
  {name:"DNTPun", text:"Do not talk not set with no words.", displayed:false},
  {name:"FadeDisappear", text:"\"Hide previous characters\" set during fadeout.", displayed:false},
  {name:"MergeMismatch", text:"Mismatched speakers across merged frames", displayed:false},
  {name:"TextSync", text:"Sync with text typing enabled.", displayed:false},
  {name:"TextTimeTooShort", text:"Timed frame too short for text (TODO: Factor in tags).", displayed:false},
  {name:"FadeTimeTooShort", text:"Timed frame too short for fade.", displayed:false},
  {name:"DefaultNull", text: "Undesirable default value for frame action left unchanged. (Default only, no advanced mode checks currently)", displayed:false}
];

function flagFrame(category, message) {
  if (lastCategory != category && lastCategory != "") {
    console.groupEnd();
  }

  /* Create category */
  if (category != "End") {
    
    for (let i=0; i < categoryStrings.length; i++) {
      if (categoryStrings[i].name == category) {
        if (categoryStrings[i].displayed == false) {
          console.groupCollapsed(categoryStrings[i].text);
          categoryStrings[i].displayed = true;
          lastCategory = category;
        }
        break;
      }
    }
    
    /* Display the actual message */
    console.info(message);
  } 
  else {
    console.groupEnd();
  }
}

function showDoNotTalkBlueText() {
  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    var frame = trial_data.frames[frameIndex];

    if (frame.speaker_id > 0 && frame.text_colour == '#6BC7F6') { /* Default blue */
      
      /* No characters in array w/ set speaker. */
      if (!frame.characters[0]) {
        flagFrame("DNTblue", "No DNT frame id #" + frame.id + " (no sprite)");
        continue;
      }

      /* Search character array for speaker */
      for (var charIndex = 0; charIndex < frame.characters.length; charIndex++) {
        
        let character = frame.characters[charIndex];
        if (character.profile_id != frame.speaker_id) {
          continue;
        } else {
          if (character.sync_mode != SYNC_STILL) { /* Do not talk */
            flagFrame("DNTblue", "No DNT frame id #" + frame.id + " (set sprite)");
          }
        }
      }
    }
  }
}

function showDoNotTalkPuntuation() {
  
  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    var frame = trial_data.frames[frameIndex];

    if (frame.speaker_id <= 0 || frame.text_content == "") { /* Has a speaker */
      continue;
    }
      
    /* Regex adapted from: https://stackoverflow.com/questions/5436824/matching-accented-characters-with-javascript-regexes#comment22195688_11550799 */
    var regularExpression = /[a-zA-Z\u00C0-\u017F]/g;
    var matches = frame.text_content.match(regularExpression);

    if (matches) { /* TODO: Filter out AAO tags as well. */
      continue;
    }

    /* No characters in array w/ set speaker. */
    if (!frame.characters[0]) {
      flagFrame("DNTPun", "No DNT frame id #" + frame.id + " (no sprite)");
      continue;
    }

    /* Search character array for speaker */
    for (var charIndex = 0; charIndex < frame.characters.length; charIndex++) {
      let character = frame.characters[charIndex];
      if (character.profile_id != frame.speaker_id) {
        continue;
      }
      
      if (character.sync_mode != SYNC_STILL) { /* Do not talk */
        flagFrame("DNTPun", "No DNT frame id #" + frame.id + " (set sprite)");
      }
    }
  }
}

function showDisappearOnFade(hideZeroDurationFade) {
  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    var frame = trial_data.frames[frameIndex];

    /* Is set to hide previous characters and has a fade. */
    if (frame.characters_erase_previous != true || frame.fade == null) {
      continue;
    }
    /* Is fadeout and not fadein */
    if (frame.fade.fade_type != 1) {
      continue;
    }
    /* OPTIONAL - Check if frame fade is 0 (For intentional extended fade disappearing) */
    if (hideZeroDurationFade && frame.fade.fade_duration == 0) {
      continue;
    }
     flagFrame("FadeDisappear", "CDDFo frame id #" + frame.id);
  }
}

function frameAfterMergedFrame(mergeProfileIdFilter, ignoreSetSpeaker) {
  for (var frameIndex = 1; frameIndex < trial_data.frames.length - 1; frameIndex++) {
    
    var currFrame = trial_data.frames[frameIndex];
    var nextFrame = trial_data.frames[frameIndex + 1];

    if (currFrame.merged_to_next == false) {
      continue;
    }
    
    /* If the same speaker and speakername, ignore it. */
    if (currFrame.speaker_id == nextFrame.speaker_id) {
      
      var currName = getSpeakersDisplayedName(currFrame);
      var nextName = getSpeakersDisplayedName(nextFrame);

      if (currName == nextName) {
        continue;
      }
    }

    /* OPTIONAL - If voice specifically set to not auto, ignore it. */
    if (ignoreSetSpeaker && nextFrame.speaker_voice != -4) {
      continue;
    }

    /* Search all. */
    if (mergeProfileIdFilter == 0) {
      flagFrame("MergeMismatch", `Different speaker ID and/or name after merged frame id #${currFrame.id} (#${nextFrame.id})`);
    }
    /* Search specific */
    else {
      if (nextFrame.speaker_id == mergeProfileIdFilter) {
        flagFrame("MergeMismatch", `Profile_id #${mergeProfileIdFilter} was found at frame id #${currFrame.id} (#${nextFrame.id})`);
      }
    }
  }
}

function getSpeakersDisplayedName(frame) {
  if (frame.speaker_use_name) {
    return frame.speaker_name;
  } 

  for (let profileIndex = 1; profileIndex < trial_data.profiles.length; profileIndex++) {
    if (trial_data.profiles[profileIndex].id == frame.speaker_id) {
      return trial_data.profiles[profileIndex].short_name;
    }
  } 
}

function showSyncTextTyping() {
  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    var frame = trial_data.frames[frameIndex];

    if (frame.speaker_id > 0) {
      
      /* No characters in array w/ set speaker. */
      if (!frame.characters[0]) {
        continue;
      }

      /* Search character array for speaker */
      for (var charIndex = 0; charIndex < frame.characters.length; charIndex++) {
        
        let character = frame.characters[charIndex];
        if (character.profile_id != frame.speaker_id) {
          continue;
        } else {
          if (character.sync_mode == SYNC_SYNC) { /* Sync */
            flagFrame("TextSync", "Sync mode enabled #" + frame.id);
          }
        }
      }
    }
  }
}

function showTooShortTextTimer() {
  for (let frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    let frame = trial_data.frames[frameIndex];

    /* No timer or text */
    if (frame.wait_time == 0 || frame.text_content == "") {
      continue;
    }

    /* Remove pauses. 
    TODO: Calculate pause time minus text in instant tag.
    TODO: Check if last characters are a pause. */
    let tag_filter = /(\[#(\/?)(.*?)\])|(\[\/#\])/g; /* Taken from display_engine_text.js, see that for breakdown. */
    let text = frame.text_content;
    let textTime = 0;
    
    text = text.replace(tag_filter, "");

    textTime = textTime + ((133 / frame.text_speed) * text.length);

    

    if (textTime < frame.wait_time) {
      continue;
    }

    flagFrame("TextTimeTooShort", `Text time longer than "Wait for..." time. Frame #${frame.id} (${textTime} > ${frame.wait_time}).`);

  }
}

function showTooShortFrameFadeTimer() {
  for (let frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    let frame = trial_data.frames[frameIndex];

    /* No fade or timer */
    if (frame.fade == null || frame.wait_time == 0) {
      continue;
    }

    if (frame.wait_time >= frame.fade.fade_duration) {
      continue;
    }

    flagFrame("FadeTimeTooShort", `Fade time longer than "Wait for..." time. Frame #${frame.id} (${frame.fade.fade_duration} > ${frame.wait_time}).`);
  }
}

function showBadUnchangedActionDefaults() { /* NOT TESTED YET */
  /* Also known as "Get action info from bigass hardcoded list". 
  This only cares for non-advanced mode values so if you're on advanced mode you're on your own.*/

  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    var frame_data = trial_data.frames[frameIndex];

    switch(frame_data.action_name)
    {
      /* Hidden in editor, should not flag. */
      case 'SceneStart': case 'SceneMove':
      case 'DialogueMenu': case 'ExaminationExamine':
      case 'DialogueTalk': case 'DialoguePresent':
      case 'CEStart': case 'CEPause':
      case 'CERestart': case 'CEReturnAfter':
      case 'CEStatement':
      /* Psyche Locks stuff. TODO: Implement these.*/
      case 'RevealDialogueLocks': case 'HideDialogueLocks':
      case 'LocksShow': case 'LocksHide':
      case 'LocksBreak': case 'LocksEnd':
      /* Intentionally skipped. */
      case 'SetHealth': case 'FlashHealth':
      case 'GameOver': case '':
      {
        continue;
      } break;

      case 'DisplayElements':
      case 'RevealElements':
      case 'HideElements': {
        let multipleInfo = frame_data.action_parameters.multiple.element;
        for(var i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].element_desc.type == "val=none") {
            flagFrame("DefaultNull", `No evidence selected on frame id #${frame_data.id}.`);
          }
        }
      } break;

      
      case 'GoTo':
      case 'SetGameOver': {
        if (frame_data.action_parameters.global.target == "val=0") {
          flagFrame("DefaultNull", `Redirect to frame 0 on frame id #${frame_data.id}.`);
        }
      } break;

      case 'RevealFrame':
      case 'HideFrame': {
        let multipleInfo = frame_data.action_parameters.multiple.frame;
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].target == "val=0") {
            flagFrame("DefaultNull", `Redirect to frame 0 on frame id #${frame_data.id}, condition #${i + 1}`);
          }
        }
      } break;

      case 'RevealObject':
      case 'HideObject': {

        let multipleInfo = frame_data.action_parameters.multiple.object;

        if(multipleInfo.length == 0) {
          flagFrame("DefaultNull", `${frame_data.action_name} action has no objects. Frame ID #${frame_data.id}.`);
          break;
        } 
          
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].place_desc == "val=0" || multipleInfo[i].object_desc == "val=0") {
            flagFrame("DefaultNull", `"None" place or object ID on frame id #${frame_data.id}, condition ${i+1}.`);
          }
        }

      } break;

      case 'RevealScene':
      case 'HideScene':
      case 'RevealDialogueIntro':
      case 'HideDialogueIntro':
      case 'RevealTalkTopic':
      case 'HideTalkTopic': {
        let TALK_TOPIC = (frame_data.action_name == 'RevealTalkTopic' || frame_data.action_name == 'HideTalkTopic');
        if(frame_data.action_parameters.global.scene == 'val=null' || (TALK_TOPIC && frame_data.action_parameters.global.dialogue == "val=null")) {
          flagFrame("DefaultNull", `${frame_data.action_name} action set on frame id #${frame_data.id} with a missing element.`);
        }
      } break;

      case 'ReduceHealth':
      case 'IncreaseHealth': {
        if(frame_data.action_parameters.global.points == "val=0") {
          flagFrame("DefaultNull", `Health changed by 0 amount on frame id #${frame_data.id}.`);
        }
      } break;

      case 'MultipleChoices': {
        let multipleInfo = frame_data.action_parameters.multiple.answer;

        if(multipleInfo.length == 0) {
          flagFrame("DefaultNull", `Player has no answers to select. Frame ID #${frame_data.id}.`);
          break;
        } 
          
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].answer_text == "val=") {
            flagFrame("DefaultNull", `Option text is blank on frame id #${frame_data.id}, option ${i+1}.`);
          }

          if (multipleInfo[i].answer_dest == "val=0") {
            flagFrame("DefaultNull", `Redirect to frame 0 on frame id #${frame_data.id}, option ${i+1}.`);
          }
        }

      } break;

      case 'AskForEvidence': {
        let multipleInfo = frame_data.action_parameters.multiple.element;

        if (frame_data.action_parameters.global.failure_dest == "val=0") {
          flagFrame("DefaultNull", `Incorrect evidence present redirects to frame 0 on frame id #${frame_data.id}.`);
        }
        
        if(multipleInfo.length == 0) {
          flagFrame("DefaultNull", `Player has no correct evidence to present. Frame ID #${frame_data.id}.`);
          break;
        } 
          
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].element_desc.type == "val=none") {
            flagFrame("DefaultNull", `"None" evidence on frame id #${frame_data.id}, option ${i+1}.`);
          }

          if (multipleInfo[i].element_dest == "val=0") {
            flagFrame("DefaultNull", `Redirect to frame 0 on frame id #${frame_data.id}, option ${i+1}.`);
          }
        }

      } break;

      case 'PointArea': {

        let globalInfo = frame_data.action_parameters.global;
        let multipleInfo = frame_data.action_parameters.multiple.area;

        if (globalInfo.background == "val=") {
          flagFrame("DefaultNull", `No background set on frame id #${frame_data.id}.`);
        }

        if (globalInfo.failure_dest == "val=0") {
          flagFrame("DefaultNull", `Incorrect area present redirects to frame 0 on frame id #${frame_data.id}.`);
        }
        
        if(multipleInfo.length == 0) {
          /* Check omitted due to legitimate use of having nothing to select.
          flagFrame("DefaultNull", `Player has no correct evidence to present. Frame ID #${frame_data.id}.`);*/
          break;
        } 
          
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].area_dest == "val=0") {
            flagFrame("DefaultNull", `Area present redirects to frame 0 on frame id #${frame_data.id}, option ${i+1}.`);
          }
        }
      } break;

      case 'InputVars': {
        let multipleInfo = frame_data.action_parameters.multiple.variable;
        
        if(multipleInfo.length == 0) {
          flagFrame("DefaultNull", `Player's input is not stored in a variable. Frame ID #${frame_data.id}.`);
          break;
        } 
          
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].var_name == "val=") {
            flagFrame("DefaultNull", `No variable name for frame id #${frame_data.id}, option ${i+1}.`);
          }
        }
      } break;
        

      case 'DefineVars': {
        let multipleInfo = frame_data.action_parameters.multiple.variable;
        
        if (multipleInfo == []) {
          flagFrame("DefaultNull", `"Define new variables" action defines nothing on frame id #${frame_data.id}.`);
          break;
        }

        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].var_name == "val=" || multipleInfo[i] == "xpr=") {
            flagFrame("DefaultNull", `Defined variables have no variable name on frame id #${frame_data.id}.`);
          }
        }
      } break;

      case 'TestExprValue': {

        let globalInfo = frame_data.action_parameters.global;
        let multipleInfo = frame_data.action_parameters.multiple.values;

        if (globalInfo.expr_type == "val=expression" && globalInfo.expression == "val=") {
          flagFrame("DefaultNull", `No expression to test on frame id #${frame_data.id}.`);
        }

        if (globalInfo.expr_type == "val=variable" && globalInfo.var_name == "val=") {
          flagFrame("DefaultNull", `No variable to test on frame id #${frame_data.id}.`);
        }

        if (globalInfo.failure_dest == "val=0") {
          flagFrame("DefaultNull", `Failure destination redirects to frame 0 on frame id #${frame_data.id}.`);
        }
        
        if(multipleInfo.length == 0) {
          flagFrame("DefaultNull", `Expressions tested against nothing. Frame ID #${frame_data.id}.`);
          break;
        } 
          
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].value == "val=") {
            flagFrame("DefaultNull", `No condition to meet on frame id #${frame_data.id}, option ${i+1}.`);
          }

          if (multipleInfo[i].value_dest == "val=0") {
            flagFrame("DefaultNull", `Condition redirects to frame 0 on frame id #${frame_data.id}, option ${i+1}.`);
          }
        }
      } break;

      case 'EvaluateConditions': {
        let multipleInfo = frame_data.action_parameters.multiple.condition;

        if (frame_data.action_parameters.global.failure_dest == "val=0") {
          flagFrame("DefaultNull", `Failure condition redirects to frame 0 on frame id #${frame_data.id}.`);
        }
        
        if(multipleInfo.length == 0) {
          flagFrame("DefaultNull", `There are no conditions to evaluate. Frame ID #${frame_data.id}.`);
          break;
        } 
          
        for (let i = 0; i < multipleInfo.length; i++) {
          if (multipleInfo[i].expression == "val=") {
            flagFrame("DefaultNull", `No expression on frame id #${frame_data.id}, condition ${i+1}.`);
          }

          if (multipleInfo[i].cond_dest == "val=0") {
            flagFrame("DefaultNull", `Redirect to frame 0 on frame id #${frame_data.id}, condition ${i+1}.`);
          }
        }

      } break;

      default: {
        flagFrame("DefaultNull", `Debug: UNDEFINED ACTION "${frame_data.action_name}". If you see this please message DeathByAutoscroll.`);
      } break;
    }
  }
}

/* FUNCTION CALLS */
console.group(`%cThe Unofficial Case Analysis Toolkit ${version}`, "color:aqua;font-size:14px;");
showDoNotTalkBlueText();
showDoNotTalkPuntuation();
showDisappearOnFade(hideZeroDurationFade);
frameAfterMergedFrame(mergeProfileIdFilter, ignoreSetSpeaker);
showSyncTextTyping();
/* showTooShortTextTimer(); */
showTooShortFrameFadeTimer();
showBadUnchangedActionDefaults();

flagFrame("End", "");

console.groupEnd();