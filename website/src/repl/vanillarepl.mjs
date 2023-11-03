import { logger, cleanupDraw } from '@strudel.cycles/core';
import { StrudelMirror } from '@strudel/codemirror';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import { transpiler } from '@strudel.cycles/transpiler';
import { prebake, resetSounds } from './prebake.mjs';
import { settingsMap } from '@src/settings.mjs';
import { setLatestCode } from '../settings.mjs';
import { hash2code, code2hash } from './helpers.mjs';
import { createClient } from '@supabase/supabase-js';
import { getRandomTune } from './helpers.mjs';

const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
);

async function initCodeFromUrl() {
  // load code from url hash (either short hash from database or decode long hash)
  try {
    const initialUrl = window.location.href;
    const hash = initialUrl.split('?')[1]?.split('#')?.[0];
    const codeParam = window.location.href.split('#')[1] || '';
    // looking like https://strudel.cc/?J01s5i1J0200 (fixed hash length)
    if (codeParam) {
      // looking like https://strudel.cc/#ImMzIGUzIg%3D%3D (hash length depends on code length)
      return hash2code(codeParam);
    } else if (hash) {
      return supabase
        .from('code')
        .select('code')
        .eq('hash', hash)
        .then(({ data, error }) => {
          if (error) {
            console.warn('failed to load hash', error);
          }
          if (data.length) {
            //console.log('load hash from database', hash);
            return data[0].code;
          }
        });
    }
  } catch (err) {
    console.warn('failed to decode', err);
  }
}
const initialCode = initCodeFromUrl();

async function run() {
  const container = document.getElementById('code');
  if (!container) {
    console.warn('could not init: no container found');
    return;
  }

  // Create a single supabase client for interacting with your database

  const settings = settingsMap.get();

  /* const drawContext = getDrawContext()
const drawTime = [-2, 2]; */
  const editor = new StrudelMirror({
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    root: container,
    initialCode: '// LOADING',
    settings,
    /* drawTime,
  onDraw: (haps, time) =>
    drawPianoroll({ haps, time, ctx: drawContext, drawTime, fold: 1 }),  */
    prebake: () => prebake(),
    afterEval: ({ code }) => {
      setLatestCode(code);
      window.location.hash = '#' + code2hash(code);
    },
  });

  const { code: randomTune, name } = getRandomTune();

  // init settings
  editor.updateSettings(settings);
  const decoded = await initialCode;
  let msg;
  if (decoded) {
    editor.setCode(decoded);
    msg = `I have loaded the code from the URL.`;
  } else if (settings.latestCode) {
    editor.setCode(settings.latestCode);
    msg = `Your last session has been loaded!`;
  } /*  if(randomTune) */ else {
    editor.setCode(randomTune);
    msg = `A random code snippet named "${name}" has been loaded!`;
  }
  console.log('msg', msg);
  /* logger(`Welcome to Strudel! ${msg} Press play or hit ctrl+enter to run it!`, 'highlight');
    setPending(false); */

  settingsMap.listen((settings, key) => editor.changeSetting(key, settings[key]));

  onEvent('strudel-toggle-play', () => editor.toggle());
  onEvent('strudel-shuffle', async () => {
    const { code, name } = getRandomTune();
    logger(`[repl] ✨ loading random tune "${name}"`);
    console.log(code);
    editor.setCode(code);
    await resetSounds();
    editor.repl.setCps(1);
    editor.repl.evaluate(code, false);
  });

  // const isEmbedded = embedded || window.location !== window.parent.location;
}

let inited = false;
onEvent('strudel-container', () => {
  if (!inited) {
    inited = true;
    run();
  }
});

function onEvent(key, callback) {
  const listener = (e) => {
    if (e.data === key) {
      callback();
    }
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
