/* AAO case polish highlighter */
var version = "v1.5";
/*
Script created by: DeathByAutoscroll.
Date created: 2nd of January, 2025.
Last edit that updated this comment: 02:10 on the 2nd of Feburary, 2025.
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

function showDoNotTalkBlueText() {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("Do not talk not set on %cblue text.", "color:#6BC7F6");
    categoryDisplayed = true;
  }
  
  for (var frameIndex = 1; frameIndex < trial_data.frames.length; frameIndex++) {
    
    var frame = trial_data.frames[frameIndex];

    if (frame.speaker_id > 0 && frame.text_colour == '#6BC7F6') { /* Default blue */
      
      /* No characters in array w/ set speaker. */
      if (!frame.characters[0]) {
        if (!categoryDisplayed) {
          console.groupCollapsed("Do not talk not set on %cblue text.", "color:#6BC7F6");
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
              console.groupCollapsed("Do not talk not set on %cblue text.", "color:#6BC7F6");
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

function showDoNotTalkPuntuation() {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("Do not talk not set with no words.");
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
              console.groupCollapsed("Do not talk not set with no words.");
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
                console.groupCollapsed("Do not talk not set with no words.");
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

function showDisappearOnFade(hideZeroDurationFade) {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("\"Hide previous characters\" set during fadeout.");
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
      console.groupCollapsed("\"Hide previous characters\" set during fadeout.");
      categoryDisplayed = true;
    }
     console.info("CDDFo frame id #" + frame.id);
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

function frameAfterMergedFrame(mergeProfileIdFilter, ignoreSetSpeaker) {
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("Mismatched speakers across merged frames");
    categoryDisplayed = true;
  }
  
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

    /* Display category for results. */
    if (!categoryDisplayed) {
      console.groupCollapsed("Mismatched speakers across merged frames");
      categoryDisplayed = true;
    }

    /* Search all. */
    if (mergeProfileIdFilter == 0) {
      console.info(`Different speaker ID and/or name after merged frame id #${currFrame.id} (#${nextFrame.id})`);
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
  var categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("Sync with text typing enabled.");
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
              console.groupCollapsed("Sync with text typing enabled.");
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

function showTooShortTextTimer() {
  let categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("Timed frame too short for text (TODO: Factor in tags).");
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
        console.groupCollapsed("Timed frame too short for text (TODO: Factor in tags).");
        categoryDisplayed = true;
      }
      console.info(`Text time longer than "Wait for..." time. Frame #${frame.id} (${textTime} > ${frame.wait_time}).`);
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

function showTooShortFrameFadeTimer() {
  let categoryDisplayed = false;
  if (displayEmptyCategories) {
    console.groupCollapsed("Timed frame too short for fade.");
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
        console.groupCollapsed("Timed frame too short for fade.");
        categoryDisplayed = true;
      }
      console.info(`Fade time longer than "Wait for..." time. Frame #${frame.id} (${frame.fade.fade_duration} > ${frame.wait_time}).`);
  }
  if (categoryDisplayed) {
    console.groupEnd();
  }
}

/* FUNCTION CALLS */
console.group(`%cAAO case polish toolkit output ${version}`, "color:aqua;font-size:14px;");
showDoNotTalkBlueText();
showDoNotTalkPuntuation();
showDisappearOnFade(hideZeroDurationFade);
frameAfterMergedFrame(mergeProfileIdFilter, ignoreSetSpeaker);
showSyncTextTyping();
/* showTooShortTextTimer(); */
showTooShortFrameFadeTimer();

console.groupEnd();