/* CornerMan technique chains. A chain is a connected system: a start position, the move that
   gets you to the next position, and what to do when the opponent reacts. Learn one link at a
   time: drill it, hit it in positional sparring, then hit it live.
   step: pos = where you are, move = what you do, cue = the detail that makes it work,
         drill = exercise id from the library (optional), if = [[their reaction, your answer], ...]
   Adding a chain is data-only. */
(function(CM){
"use strict";
CM.LEVELS=['Not started','Drilling','Hit in positional','Hit live'];
CM.CHAINS=[
{id:'bjj-back',sports:['bjj','mma'],name:'Back attack system',level:'Beginner',
 goal:'Take the back, keep it, and finish with the rear naked choke or the armbar when they defend.',
 steps:[
  {pos:'Behind them, seated',move:'Seat belt grip: choking arm over the shoulder, other arm under',cue:'Your chest glued to their back. Hide your head on the choking-arm side.',drill:'backctrl',if:[['They lean back into you','Fall to the seat-belt side so they land on top of your arm side']]},
  {pos:'Seat belt',move:'Insert both hooks, heels inside their thighs',cue:'Hooks in, knees pinched. No crossing your feet.',drill:'backctrl',if:[['They slide down to escape the hooks','Switch to a body triangle if you know it, or follow and keep the chest-to-back connection']]},
  {pos:'Back control',move:'Win the hand fight: two-on-one the hand defending the choke',cue:'Both your hands trap one of theirs. Do not reach for the choke before you win the hands.',drill:'backctrl',if:[['They pin your choking arm to their chest','Switch the choke to the other side, or attack the armbar on the far arm']]},
  {pos:'Hands won',move:'Slide the choking arm under the chin',cue:'Elbow under the chin, not on the jaw. Shoulder to their head.',drill:'rnc',if:[['They tuck their chin','Use the short choke or go to the armbar. Do not crank the jaw.']]},
  {pos:'Arm under the chin',move:'Rear naked choke finish',cue:'Hand to your own biceps, other hand behind their head, elbows together. Squeeze slowly and let go the moment they tap.',drill:'rnc',if:[['They escape to their back on the mat','Follow to mount: step 3 of the pins chain']]}
 ]},
{id:'bjj-guard',sports:['bjj'],name:'Guard retention and recovery',level:'Beginner',
 goal:'Stop the pass before it happens, get your guard back when it starts, and wrestle up when you cannot.',
 steps:[
  {pos:'Open guard, on your back',move:'Feet on the hips, frames ready',cue:'Knees and elbows stay between you and them. Never lie flat.',drill:'guardret',if:[['They push your knees to the mat','Turn your hips and bring the knee back across (knee shield)']]},
  {pos:'They start to pass',move:'Frame on the neck and hip, then shrimp away',cue:'Frames make space. Hips make distance. Then the knee comes back in.',drill:'shrimp',if:[['They flatten you out','Turn to your side early and recover the knee shield']]},
  {pos:'Space made',move:'Bring the knee back in and recover guard',cue:'Hip escape first, then the knee, then the foot on the hip.',drill:'sideesc',if:[['They keep walking around','Turn to your knees and come up to a single leg']]},
  {pos:'Guard recovered or they stand',move:'Technical stand-up or come up to a single leg',cue:'Post a hand, lift the hips, step back to stance. Head stays up.',drill:'techstand',if:[['They sprawl','Go to the front headlock chain from your side, or pull back to guard']]}
 ]},
{id:'bjj-pass',sports:['bjj','mma'],name:'Passing system: toreando to knee cut',level:'Intermediate',
 goal:'Get past the legs, pin, and move up to mount without giving up space.',
 steps:[
  {pos:'Standing, they are on their back',move:'Break grips and control both knees',cue:'Strip the grips first. Hands on the knees, elbows in.',drill:'passfoot',if:[['They grab your sleeves or collar','Strip the grip with two hands before you move']]},
  {pos:'Knees controlled',move:'Toreando: push the knees to one side and step around',cue:'Push the knees to the mat and move your feet fast. Stay low.',drill:'toreando',if:[['They turn and frame','Drop to a knee cut on the near leg']]},
  {pos:'Half past',move:'Knee cut: crossface and underhook, then slide the knee',cue:'Head control before the slide. The knee goes across their thigh, not under it.',drill:'kneecut',if:[['They get an underhook','Switch to the other side or flatten them with your chest before you slide']]},
  {pos:'Past the legs',move:'Side control: chest heavy, hips low',cue:'Their head turned away from you, your hips low and wide.',drill:'kob',if:[['They frame and shrimp','Knee-on-belly to stop the hip escape']]},
  {pos:'Side control',move:'Step over to mount',cue:'Slide the knee across their belly while your chest stays heavy.',drill:'mountret',if:[['They block with a knee','Use knee-on-belly, then step over when the knee drops']]}
 ]},
{id:'bjj-pins',sports:['bjj','mma'],name:'Pins and top submissions',level:'Beginner',
 goal:'Hold side control and mount, and use their escape attempts to set up the kimura and armbar.',
 steps:[
  {pos:'Side control',move:'Pin the far arm and isolate the near arm',cue:'Shoulder pressure on the jaw line, hips low.',drill:'kimura',if:[['They push your head away','The near arm is now loose: go to the kimura grip']]},
  {pos:'Arm isolated',move:'Kimura grip: figure-four on the wrist',cue:'Their wrist to their hip, then walk around their head. Turn the arm slowly.',drill:'kimura',if:[['They grab their own belt or leg','Step over the head and pull, or switch to an armbar']]},
  {pos:'Side control',move:'Step over to mount',cue:'Take mount when they turn away to escape.',drill:'mountret',if:[['They bridge','Post wide hands and keep the hips low']]},
  {pos:'Mount',move:'Climb high and isolate an arm',cue:'Knees high under the armpits. Their elbows away from their body.',drill:'mountret',if:[['They turn to the side','Take the back: back attack chain step 2']]},
  {pos:'High mount, arm isolated',move:'Armbar from mount',cue:'Control the arm on your chest, pivot, then squeeze your knees together. Lift the hips slowly.',drill:'armbar',if:[['They stack you','Roll to the side the arm is on and finish from there']]}
 ]},
{id:'bjj-closed',sports:['bjj'],name:'Closed guard attacks: triangle, armbar, sweep',level:'Beginner',
 goal:'Break their posture, then use every defense to set up the next attack.',
 steps:[
  {pos:'Closed guard',move:'Break posture: pull them down with your knees and hands',cue:'Collar and sleeve, knees pull in. Their head below their hips.',drill:'hipbump',if:[['They posture up hard','Hip bump sweep while they rise']]},
  {pos:'Posture broken',move:'Triangle setup: one arm in, one arm out',cue:'Push the arm away, shoot the leg over the neck, cut the angle.',drill:'triangle',if:[['They pull the arm back out','Switch to the armbar on the other arm']]},
  {pos:'Arm extended',move:'Armbar from guard',cue:'Hips high, knee across the face, thumb pointing up.',drill:'armbar',if:[['They stack','Go back to closed guard and start again']]},
  {pos:'They post a hand',move:'Hip bump sweep to mount',cue:'Sit up on your elbow and drive your hip into their chest.',drill:'hipbump',if:[['They push back to block','Kimura grip on the posted arm']]}
 ]},
{id:'bjj-legs',sports:['bjj'],name:'Lower body entry: straight ankle lock',level:'Intermediate',
 goal:'Enter the legs safely, control the hips, and finish with a straight ankle lock. Heel hooks are for advanced players under an instructor only.',
 safety:'Go slow on every leg lock. Release the moment your partner taps. Never spin out of a leg lock.',
 steps:[
  {pos:'Seated guard',move:'Shin-to-shin entry under their leg',cue:'Your shin to their shin, then lift and pull them onto your hips.',drill:'ashi',if:[['They step back','Come up to a single leg instead']]},
  {pos:'Leg off the mat',move:'Ashi garami: outside foot on the hip, knees pinched',cue:'No space at the hips. Their knee pinned to your chest.',drill:'ashi',if:[['They try to step over','Kick them off balance and come up on top']]},
  {pos:'Ashi garami',move:'Straight ankle lock grip',cue:'Foot deep in your armpit, blade of the wrist under the Achilles.',drill:'anklelock',if:[['They sit up to fight your grips','Fall back again and kick the hip away']]},
  {pos:'Grip locked',move:'Finish slowly',cue:'Arch your back and push their hip away. Slow pressure, release on the tap.',drill:'anklelock',if:[['They roll with it','Follow the roll and keep the knee pinch, or come up on top']]}
 ]},
{id:'grap-fhl',sports:['bjj','wrestling','mma'],name:'Front headlock system',level:'Intermediate',
 goal:'Punish a bad shot or a turtle: go behind, or finish the guillotine.',
 steps:[
  {pos:'Standing, collar tie',move:'Snap down',cue:'Pull the head down toward their feet while stepping back.',drill:'snapdown',if:[['They pop their head up','Shoot your own takedown as they rise']]},
  {pos:'They are on their knees, head down',move:'Front headlock control',cue:'Chest heavy on their head, chin strap grip, hips back.',drill:'guillo',if:[['They shoot for your legs','Sprawl and keep the headlock']]},
  {pos:'Front headlock',move:'Spin behind to the back',cue:'Go to the side their head is on, chest on their back the whole time.',drill:'snapdown',if:[['They follow you around','Change direction and spin the other way']]},
  {pos:'They come up to stand',move:'Guillotine',cue:'Wrist under the chin, close your elbow, hips forward.',drill:'guillo',if:[['They take you down while you hold it','Pull to closed guard and finish there']]}
 ]},
{id:'bjj-escapes',sports:['bjj','mma'],name:'Survival escapes from the bottom',level:'Beginner',
 goal:'Get out of mount, side control and turtle without giving up your back.',
 steps:[
  {pos:'Bottom side control',move:'Frames on the neck and hip',cue:'Forearm across their neck, other hand on the hip. Do not push with straight arms.',drill:'sideesc',if:[['They switch to knee-on-belly','Push the knee and shrimp away']]},
  {pos:'Frames set',move:'Shrimp and recover guard',cue:'Hip escape away, then slide the knee in.',drill:'shrimp',if:[['They follow you','Turn to your knees and stand up']]},
  {pos:'Bottom mount',move:'Trap and roll (upa)',cue:'Trap an arm and the foot on the same side, then bridge over your shoulder.',drill:'bridgeroll',if:[['They post the trapped side','Elbow-knee escape to the other side']]},
  {pos:'Still mounted',move:'Elbow-knee escape',cue:'Frame on the hip, shrimp, and slide your knee under their leg.',drill:'elbowknee',if:[['They climb high','Elbows tight and push them down before you shrimp']]},
  {pos:'Turtle',move:'Sit-out or granby roll back to guard',cue:'Never let a hook in. Roll over the shoulder, never the neck.',drill:'granby',if:[['They take the seat belt','Fight the hands first, then slide to the mat on the seat-belt side']]}
 ]},
{id:'mma-strike-td',sports:['mma'],name:'Strike to takedown',level:'Intermediate',
 goal:'Hide the shot behind punches and finish on the cage or in the open.',
 steps:[
  {pos:'Range, orthodox stance',move:'Jab and cross to raise their guard',cue:'Hands back to your chin after each punch.',drill:'jab',if:[['They counter over the top','Slip and change levels under it']]},
  {pos:'Guard up',move:'Level change and penetration step',cue:'Bend the knees, not the waist. Head up.',drill:'mmacombo',if:[['They sprawl','Go to the front headlock chain or back to your feet']]},
  {pos:'Double leg in',move:'Run the pipe to finish',cue:'Head on the outside and turn the corner.',drill:'runpipe',if:[['They back to the cage','Switch to the cage wrestling chain']]},
  {pos:'Landed in half guard',move:'Pass with heavy pressure',cue:'Crossface, underhook, flatten them out.',drill:'kneecut',if:[['They come up on an underhook','Knee cut to the other side']]},
  {pos:'Side or mount',move:'Ground and pound from posture',cue:'Short strikes, heavy hips, keep the position over the strikes.',drill:'gnp',if:[['They turn their back','Back attack chain step 1']]}
 ]},
{id:'mma-cage',sports:['mma','wrestling'],name:'Cage wrestling',level:'Intermediate',
 goal:'Pin them on the wall, win the head and underhooks, and take them down.',
 steps:[
  {pos:'Clinch on the cage',move:'Win the underhook',cue:'Head under their chin, hips close.',drill:'cageclinch',if:[['They pummel back','Keep pummeling, never stop hand fighting']]},
  {pos:'Underhook',move:'Knee tap or body lock trip',cue:'Pull the shoulder over the leg you are taking.',drill:'cageclinch',if:[['They widen their base','Switch to a double leg off the wall']]},
  {pos:'They wall walk up',move:'Follow to the back as they turn',cue:'Chest on their back, hands locked low.',drill:'backctrl',if:[['They face you','Re-pummel for the underhook']]},
  {pos:'Back standing',move:'Mat return',cue:'Hands locked at the waist, step behind and sit them down.',drill:'posspar',if:[['They grab your hands','Switch to a seat belt and drag them down']]}
 ]},
{id:'mma-getup',sports:['mma'],name:'Getting up off the mat',level:'Beginner',
 goal:'Survive the bottom, use the wall, and get back to your feet safely.',
 steps:[
  {pos:'Bottom guard',move:'Frames and posture control',cue:'Keep their head close or far, never in between.',drill:'guardret',if:[['They posture to strike','Feet on the hips, push away']]},
  {pos:'Space',move:'Butterfly hook and come to your side',cue:'Hook under their leg, elbow on the mat.',drill:'butterflysw',if:[['They flatten you','Frame and shrimp again']]},
  {pos:'Near the cage',move:'Wall walk',cue:'Back to the wall, post a hand and walk up it.',drill:'cagewalk',if:[['They hold your legs','Hand fight and wrist control']]},
  {pos:'Standing on the wall',move:'Separate with strikes or circle off',cue:'Break their grips, frame, and turn out.',drill:'pivot',if:[['They re-shoot','Sprawl and circle off']]}
 ]},
{id:'mma-tdd',sports:['mma','wrestling'],name:'Takedown defense to counter',level:'Beginner',
 goal:'Stop the shot and punish it.',
 steps:[
  {pos:'Stance',move:'Read the level change',cue:'Watch their hips. Hands low enough to catch the head.',drill:'stance',if:[['They fake high','Stay square and keep your hands ready']]},
  {pos:'They shoot',move:'Sprawl',cue:'Hips back and down, legs out wide.',drill:'sprawl',if:[['They keep driving','Crossface and circle']]},
  {pos:'Sprawled',move:'Crossface and circle off',cue:'Push their head away from the leg they want.',drill:'tddefense',if:[['They hold a leg','Whizzer and turn away']]},
  {pos:'They are down',move:'Front headlock or back to your feet',cue:'You choose: go behind or walk away.',drill:'snapdown',if:[['They come up','Strike as they rise']]}
 ]},
{id:'wr-single',sports:['wrestling','mma'],name:'Single leg chain',level:'Beginner',
 goal:'Set up the single leg, finish it, and switch finishes when they defend.',
 steps:[
  {pos:'Stance',move:'Hand fight to clear their hands',cue:'Inside position first.',drill:'handfight',if:[['They tie up your collar','Snap them down and re-set']]},
  {pos:'Hands cleared',move:'Level change and shot to the lead leg',cue:'Penetrate deep, head up on their chest.',drill:'shot',if:[['They sprawl','Get your head up and come to your feet']]},
  {pos:'Leg captured',move:'Run the pipe',cue:'Pull the leg tight to you and turn the corner.',drill:'runpipe',if:[['They hop on one leg','Switch to a high crotch finish']]},
  {pos:'Still standing',move:'High crotch or switch to a double',cue:'Change direction when they lean.',drill:'highcrotch',if:[['They whizzer','Circle away and drive them down']]}
 ]},
{id:'wr-bottom',sports:['wrestling'],name:'Bottom: get out',level:'Beginner',
 goal:'Escape from referee\'s position by standing or sitting out.',
 steps:[
  {pos:'Bottom, referee\'s position',move:'Hand control first',cue:'Take their hands before you move.',drill:'standup',if:[['They break you down flat','Get back to a base on your hands and knees']]},
  {pos:'Hands controlled',move:'Stand-up',cue:'Outside foot steps up and back pressure into them.',drill:'standup',if:[['They lock your waist','Peel the hands and turn into them']]},
  {pos:'Stand-up stalled',move:'Sit-out and turn in',cue:'Sit to your hip and turn to face.',drill:'sitout',if:[['They follow you','Switch the direction and stand up']]},
  {pos:'Facing them',move:'Back to neutral stance',cue:'Separate and reset your stance.',drill:'stance',if:[['They shoot right away','Sprawl']]}
 ]},
{id:'box-jab',sports:['boxing','mma'],name:'Jab to counter',level:'Beginner',
 goal:'Own the range with the jab, then counter when they answer.',
 steps:[
  {pos:'Range',move:'Jab to the head',cue:'Step with the jab and snap it back to the chin.',drill:'jab',if:[['They parry it','Double the jab']]},
  {pos:'Jab landed',move:'Jab to the body, jab to the head',cue:'Bend the knees, not the waist.',drill:'bodyshot',if:[['They drop their hands','Go up top with the cross']]},
  {pos:'They answer with a jab',move:'Slip and return the cross',cue:'Slip outside, load the hip, fire the cross.',drill:'counter',if:[['They throw a hook','Roll under and come back with a hook']]},
  {pos:'After the exchange',move:'Pivot out to an angle',cue:'Never leave on the same line you came in on.',drill:'pivot',if:[['They follow','Jab and re-set']]}
 ]}
];
CM.CHAINM=Object.fromEntries(CM.CHAINS.map(function(c){return [c.id,c];}));
})(globalThis.CM=globalThis.CM||{});
