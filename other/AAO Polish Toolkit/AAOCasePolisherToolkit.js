/*
AAO case polish highlighter
*/

var version = "v1.4";
/*
Script created by: DeathByAutoscroll.
Date created: 2nd of January, 2025.
Last edit that updated this comment: 23:48 on the 14th of January, 2025.
*/

/* USER OPTIONS */

/* Toolkit */
var displayEmptyCategories = false; /* Shows all categories, even if there are no results. */
var groupColour = "color:cornsilk;"; /* The text colour of each category (does not affect results). */

/* Fades */
var hideZeroDurationFade = false; /* Fades of 0ms won't appear in the results. */

/* Merged profiles*/
var mergeProfileIdFilter = 0; /* 0 = No filter */
var ignoreSetSpeaker = true; /* Ignores non auto voices if true */

/* END OF OPTIONS */

function showDoNotTalkBlueText(groupColour) {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("%cDo not talk not set on %cblue text.", groupColour, "color:#6BC7F6");
    categoryDisplayed = true;
  }
  
  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    var frame = trial_data.frames[frameIndex];

    if (frame.speaker_id > 0 && frame.text_colour == '#6BC7F6') { /* Default blue */
      
      /* No characters in array w/ set speaker. */
      if (!frame.characters[0]) {
        if (!categoryDisplayed) {
          console.groupCollapsed("%cDo not talk not set on %cblue text.", groupColour, "color:#6BC7F6");
          categoryDisplayed = true;
        }
        console.info("No DNT frame id #" + frame.id + " (no sprite)");
        continue;
      }

      /* Search character array for speaker */
      for (var charIndex = 0; charIndex < frame.characters.length; charIndex++) {
        
        let character = frame.characters[charIndex];
        if (character.profile_id != frame.speaker_id) {
          continue;
        } else {
          if (character.sync_mode != SYNC_STILL) { /* Do not talk */
            if (!categoryDisplayed) {
              console.groupCollapsed("%cDo not talk not set on %cblue text.", groupColour, "color:#6BC7F6");
              categoryDisplayed = true;
            }
            console.info("No DNT frame id #" + frame.id + " (set sprite)");
          }
        }
      }
    }
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }

}

function showDoNotTalkPuntuation(groupColour) {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("%cDo not talk not set with no words.", groupColour);
    categoryDisplayed = true;
  }
  
  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    var frame = trial_data.frames[frameIndex];

    if (frame.speaker_id > 0 && frame.text_content != "") { /* Has a speaker */
      
      /* Regex adapted from: https://stackoverflow.com/questions/5436824/matching-accented-characters-with-javascript-regexes#comment22195688_11550799 */
      var regularExpression = /[a-zA-Z\u00C0-\u017F]/g;
      var matches = frame.text_content.match(regularExpression);

      if (!matches) { /* TODO: Filter out AAO tags as well. */
        /* No characters in array w/ set speaker. */
        if (!frame.characters[0]) {
            if (!categoryDisplayed) {
              console.groupCollapsed("%cDo not talk not set with no words.", groupColour);
              categoryDisplayed = true;
            }
          console.info("No DNT frame id #" + frame.id + " (no sprite)");
          continue;
        }

        /* Search character array for speaker */
        for (var charIndex = 0; charIndex < frame.characters.length; charIndex++) {
          
          let character = frame.characters[charIndex];
          if (character.profile_id != frame.speaker_id) {
            continue;
          } else {
            if (character.sync_mode != SYNC_STILL) { /* Do not talk */
              if (!categoryDisplayed) {
                console.groupCollapsed("%cDo not talk not set with no words.", groupColour);
                categoryDisplayed = true;
              }
              console.info("No DNT frame id #" + frame.id + " (set sprite)");
            }
          }
        }
      }
    }
  }
  if (categoryDisplayed) {
  console.groupEnd();
  }
}

function showDisappearOnFade(groupColour, hideZeroDurationFade) {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("%c\"Hide previous characters\" set during fadeout.", groupColour);
    categoryDisplayed = true;
  }
  
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

    /* Display category on results */
    if (!categoryDisplayed) {
      console.groupCollapsed("%c\"Hide previous characters\" set during fadeout.", groupColour);
      categoryDisplayed = true;
    }
     console.info("CDDFo frame id #" + frame.id);
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

function frameAfterMergedFrame(groupColour, mergeProfileIdFilter, ignoreSetSpeaker) { /* Default to None ID */
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("%cMismatched speakers across merged frames", groupColour);
    categoryDisplayed = true;
  }
  
  for (var frameIndex = 1; frameIndex < trial_data.frames.length - 1; frameIndex++) {
    
    var currFrame = trial_data.frames[frameIndex];
    var nextFrame = trial_data.frames[frameIndex + 1];



    if (currFrame.merged_to_next == false) {
      continue;
    }
    
    /* If the same speaker, ignore it. */
    if (currFrame.speaker_id == nextFrame.speaker_id && currFrame.speaker_name == nextFrame.speaker_name) {
      continue;
    }

    /* OPTIONAL - If voice specifically set to not auto, ignore it. */
    if (ignoreSetSpeaker && nextFrame.speaker_voice != -4) {
      continue;
    }

    /* Display category for results. */
    if (!categoryDisplayed) {
      console.groupCollapsed("%cMismatched speakers across merged frames", groupColour);
      categoryDisplayed = true;
    }

    /* Search all. */
    if (mergeProfileIdFilter == 0) {
      if (nextFrame.speaker_id < 0) { /* Default profile */
        console.info(`Default speaker after named merged frame id #${currFrame.id} (#${nextFrame.id})`);
      } 
      else {
        console.info(`Named speaker after named merged frame id #${currFrame.id} (#${nextFrame.id})`);
      }
    }
    /* Search specific */
    else {
      if (nextFrame.speaker_id == mergeProfileIdFilter) {
        console.info(`Profile_id #${mergeProfileIdFilter} was found at frame id #${currFrame.id} (#${nextFrame.id})`);
      }
    }
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

function showSyncTextTyping(groupColour) {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("%cSync with text typing enabled.", groupColour);
    categoryDisplayed = true;
  }
  
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
            if (!categoryDisplayed) {
              console.groupCollapsed("%cSync with text typing enabled.", groupColour);
              categoryDisplayed = true;
            }
            console.info("Sync mode enabled #" + frame.id);
          }
        }
      }
    }
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

function showTooShortTextTimer(groupColour) {
  let categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("%cTimed frame too short for text (TODO: Factor in tags).", groupColour);
    categoryDisplayed = true;
  }
  
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

    if (!categoryDisplayed) {
        console.groupCollapsed("%cTimed frame too short for text (TODO: Factor in tags).", groupColour);
        categoryDisplayed = true;
      }
      console.info(`Text time longer than "Wait for..." time. Frame #${frame.id} (${textTime} > ${frame.wait_time}).`);
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

function showTooShortFrameFadeTimer(groupColour) {
  let categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("%cTimed frame too short for fade.", groupColour);
    categoryDisplayed = true;
  }
  
  for (let frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    let frame = trial_data.frames[frameIndex];

    /* No fade or timer */
    if (frame.fade == null || frame.wait_time == 0) {
      continue;
    }

    if (frame.wait_time >= frame.fade.fade_duration) {
      continue;
    }

    if (!categoryDisplayed) {
        console.groupCollapsed("%cTimed frame too short for fade.", groupColour);
        categoryDisplayed = true;
      }
      console.info(`Fade time longer than "Wait for..." time. Frame #${frame.id} (${frame.fade.fade_duration} > ${frame.wait_time}).`);
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

/* FUNCTIONS */
console.group(`%cAAO case polish toolkit output ${version}`, "color:aqua;font-size:14px;");
showDoNotTalkBlueText(groupColour);
showDoNotTalkPuntuation(groupColour);
showDisappearOnFade(groupColour, hideZeroDurationFade);
frameAfterMergedFrame(groupColour, mergeProfileIdFilter, ignoreSetSpeaker);
showSyncTextTyping(groupColour);
showTooShortTextTimer(groupColour);
showTooShortFrameFadeTimer(groupColour);

console.groupEnd();