/* CornerMan exercise library. One row per exercise:
   id|name|pattern|equipment|difficulty|unit|sports|avoid|muscles|cue|common error|easier|harder
   unit r=reps t=seconds m=minutes. sports: * all, +a,b = everyone but preferred for a,b, a,b = only those.
   Adding an exercise is data-only: add a row. */
(function(CM){
"use strict";
const RAW=`
goblet|Goblet squat|squat|db|1|r|*|ankle|Quads, glutes|Hold the weight at your chest and sit down between your knees|Heels lifting off the floor|Squat to a chair|Add a 3-second pause at the bottom
bwsquat|Bodyweight squat|squat|bw|1|r|*|knee|Quads, glutes|Push your knees out over your toes and keep your chest tall|Knees caving inward|Squat to a high box|Pause squat
backsquat|Barbell back squat|squat|gym|2|r|+powerlifting,bodybuilding|knee,lowback|Quads, glutes, back|Brace your abs, sit between your hips and drive up through mid-foot|Hips rising faster than the chest|Goblet squat|Pause back squat
frontsquat|Front squat|squat|gym|3|r|+powerlifting,wrestling|knee,lowback,wrist|Quads, upper back|Keep your elbows high and your torso upright|Elbows dropping|Goblet squat|Pause front squat
pausesquat|Pause squat|squat|gym|3|r|powerlifting|knee,lowback|Quads, glutes|Hold the bottom for 2 seconds while staying tight|Relaxing at the bottom|Back squat|Heavier pause squat
pistol|Pistol squat to box|squat|bw|3|r|calisthenics|knee,ankle|Quads, glutes, balance|Reach forward as you sit onto the box on one leg|Collapsing the knee inward|Assisted squat holding a post|Lower box
splitsquat|Bulgarian split squat|lunge|db|2|r|*|knee,hip|Quads, glutes|Lean slightly forward and drop the back knee straight down|Front knee drifting inward|Split squat with a support|Add heavier dumbbells
revlunge|Reverse lunge|lunge|bw|1|r|*|knee|Quads, glutes|Step back softly and keep the front heel down|Front knee collapsing in|Split squat holding a support|Hold dumbbells
walklunge|Walking lunge|lunge|db|2|r|*|knee|Quads, glutes|Take long steps and keep your torso tall|Short steps with the knee past the toes|Reverse lunge|Heavier weights
stepup|Step-up|lunge|bw|1|r|*|knee|Quads, glutes|Press through the whole foot on the box|Pushing off the back foot|Lower box|Higher box or dumbbells
latlunge|Lateral lunge|lunge|bw|1|r|+mma,wrestling,bjj|hip,knee|Adductors, glutes|Sit back into one hip with toes forward and the other leg straight|Rounding the back|Smaller step|Hold a weight at your chest
rdl|Dumbbell Romanian deadlift|hinge|db|2|r|*|lowback|Hamstrings, glutes|Push your hips back with soft knees and a flat back|Rounding the lower back|Hip hinge with a broomstick|Single-leg version
deadlift|Conventional deadlift|hinge|gym|3|r|+powerlifting,bodybuilding|lowback|Hamstrings, glutes, back|Push the floor away and keep the bar against your legs|Hips shooting up first|Dumbbell Romanian deadlift|Paused deadlift
sumo|Sumo deadlift|hinge|gym|3|r|powerlifting|lowback,hip|Glutes, adductors, back|Spread the floor with your feet and keep your chest up|Knees collapsing inward|Goblet squat|Deficit sumo deadlift
dbswing|Dumbbell swing|hinge|db|2|r|+mma,wrestling,weightloss|lowback|Hips, hamstrings|Snap your hips forward to float the weight to chest height|Lifting with the arms|Hip hinge drill|Heavier weight
bridge|Glute bridge|hinge|bw|1|r|*|-|Glutes, hamstrings|Drive through your heels and squeeze at the top|Overarching the lower back|Shorter range of motion|Single-leg bridge
hipthrust|Barbell hip thrust|hinge|gym|2|r|+bodybuilding|-|Glutes|Tuck your chin and finish with your ribs down|Overarching at the top|Glute bridge|Pause at the top
slrdl|Single-leg Romanian deadlift|hinge|db|2|r|*|lowback|Hamstrings, glutes, balance|Reach back with a long spine and square hips|Twisting the hips open|Kickstand Romanian deadlift|Heavier weight
backext|Prone back extension|hinge|bw|1|r|*|lowback|Spinal erectors, glutes|Lift your chest slightly and squeeze your glutes|Cranking the neck up|Hold for time|Add arms overhead
pushup|Push-up|push|bw|1|r|*|wrist,shoulder|Chest, shoulders, triceps|Keep your body in one line and elbows at about 45 degrees|Hips sagging|Incline push-up|Feet-elevated push-up
inclinepu|Incline push-up|push|bw|1|r|*|wrist|Chest, triceps|Hands on a bench or counter and body straight|Hips piking up|Wall push-up|Push-up
pike|Pike push-up|push|bw|2|r|+calisthenics|shoulder,wrist|Shoulders, triceps|Hips high and head moves between your hands|Flaring the elbows wide|Elevated hands pike|Feet-elevated pike
archer|Archer push-up|push|bw|3|r|calisthenics|shoulder,wrist|Chest, shoulders|Shift your weight to one arm and keep the other long|Twisting the torso|Wide push-up|One-arm lean
dbpress|Dumbbell shoulder press|push|db|1|r|*|shoulder|Shoulders, triceps|Press straight up and keep your ribs down|Leaning back|Seated press|Single-arm press
floorpress|Dumbbell floor press|push|db|1|r|*|shoulder|Chest, triceps|Lower until your upper arms touch the floor|Elbows flaring wide|Push-up|Alternating floor press
bench|Barbell bench press|push|gym|2|r|+powerlifting,bodybuilding|shoulder|Chest, shoulders, triceps|Shoulder blades back and down, feet planted|Bouncing the bar off the chest|Dumbbell floor press|Pause bench press
pausebench|Pause bench press|push|gym|3|r|powerlifting|shoulder|Chest, triceps|Hold the bar on your chest for a full second|Losing tightness at the pause|Bench press|Heavier pause
ohp|Barbell overhead press|push|gym|2|r|+powerlifting|shoulder,lowback|Shoulders, triceps|Squeeze your glutes and press the bar in a straight line|Leaning back|Dumbbell shoulder press|Push press
dip|Parallel bar dips|push|bar|3|r|+calisthenics|shoulder,elbow|Chest, triceps|Lean slightly forward and lower under control|Dropping too fast|Bench dips|Weighted dips
pushdown|Band triceps pushdown|push|band|1|r|+bodybuilding|elbow|Triceps|Pin your elbows to your sides|Swinging the shoulders|Lighter band|Heavier band
latraise|Dumbbell lateral raise|push|db|1|r|+bodybuilding|shoulder|Side delts|Lead with your elbows and stop at shoulder height|Shrugging|Lighter weights|Slow lowering
bandpress|Band chest press|push|band|1|r|*|shoulder|Chest, triceps|Anchor the band behind you and press forward|Shoulders rolling up|Push-up|Heavier band
planche|Planche lean hold|push|bw|2|t|calisthenics|wrist,shoulder|Shoulders, core, wrists|Lean forward over your hands with locked arms|Bending the elbows|Smaller lean|Longer lean
dbrow|One-arm dumbbell row|pull|db|1|r|*|-|Lats, upper back|Pull the elbow to your hip and keep your back flat|Twisting the torso|Band row|Heavier dumbbell
pullup|Pull-up|pull|bar|2|r|+calisthenics,bjj|shoulder,elbow|Lats, biceps|Start from a dead hang and lead with your chest|Kipping with the legs|Band-assisted pull-up|Weighted pull-up
chinup|Chin-up|pull|bar|2|r|*|elbow|Lats, biceps|Palms toward you and chin over the bar|Half reps|Negative chin-up|Weighted chin-up
invrow|Inverted row|pull|bw|1|r|*|-|Upper back, biceps|Pull your chest to a sturdy table or low bar with a straight body|Hips sagging|Bend your knees|Feet-elevated row
bandrow|Band row|pull|band|1|r|*|-|Upper back, biceps|Squeeze your shoulder blades together at the end|Shrugging the shoulders|Lighter band|Heavier band
latpull|Lat pulldown|pull|gym|1|r|+bodybuilding|shoulder|Lats|Pull the bar to your upper chest with your elbows down|Leaning far back|Band pulldown|Heavier stack
bbrow|Barbell row|pull|gym|2|r|+powerlifting,bodybuilding|lowback|Lats, upper back|Hinge to a flat back and row to your lower ribs|Standing up with each rep|Dumbbell row|Pause at the top
facepull|Band face pull|pull|band|1|r|*|-|Rear delts, upper back|Pull toward your eyes with elbows high|Leaning back|Lighter band|Add a 2-second hold
scappull|Scapular pull-up|pull|bar|1|r|calisthenics,bjj|shoulder|Lower traps, lats|Hang and pull your shoulder blades down without bending the arms|Bending the elbows|Band-assisted hang|Full pull-up
dbcurl|Dumbbell curl|pull|db|1|r|+bodybuilding|elbow|Biceps|Keep your elbows at your sides and lower slowly|Swinging the body|Lighter weights|Slow lowering
towelhang|Towel or bar hang|grip|bar|2|t|+bjj,wrestling|elbow|Grip, forearms|Hang with your shoulders packed down|Shrugging up to your ears|Shorter holds|Single-arm hang
farmer|Farmer carry|grip|db|1|t|*|-|Grip, core, traps|Walk tall with ribs down and shoulders back|Leaning to one side|Lighter weights|Heavier or single-arm
plank|Front plank|core|bw|1|t|*|-|Core|Squeeze glutes and ribs down in one straight line|Hips sagging|Plank on knees|Long-lever plank
sideplank|Side plank|core|bw|1|t|*|-|Obliques, hips|Stack your feet and lift your hips|Hips dropping|Knees bent|Top leg raised
deadbug|Dead bug|core|bw|1|r|*|-|Deep core|Press your lower back into the floor as you reach|Back arching|Heels tap only|Add a light weight
birddog|Bird dog|core|bw|1|r|*|-|Core, glutes, back|Reach long and keep the hips level|Rotating the hips|Arms only|Pause for 3 seconds
kneeraise|Hanging knee raise|core|bar|2|r|*|shoulder|Abs, hip flexors|Curl your pelvis up instead of swinging|Swinging|Lying leg raise|Straight-leg raise
pallof|Band Pallof press|core|band|1|r|*|-|Anti-rotation core|Press straight out and resist the pull|Letting the torso twist|Lighter band|Step farther from the anchor
hollow|Hollow body hold|core|bw|2|t|+calisthenics|-|Abs|Press your lower back down and lift your legs and shoulders|Back arching|Tuck hold|Straight-leg hold
russian|Russian twist|core|bw|1|r|+mma,boxing,wrestling|lowback|Obliques|Rotate from the ribs and keep the chest up|Moving only the arms|Feet down|Hold a weight
bicycle|Bicycle crunch|core|bw|1|r|*|neck|Abs, obliques|Slow elbow-to-knee turns without pulling on your neck|Pulling the head|Dead bug|Slower tempo
brisk|Brisk walk|cardio|bw|1|m|*|-|Heart, legs|Walk fast enough that you can talk but not sing|Slouching|Shorter walk|Add hills
easyrun|Easy run|cardio|bw|1|m|running|ankle,knee|Heart, legs|Keep a pace where you could chat the whole time|Running too fast|Run-walk intervals|Longer easy run
tempo|Tempo run|cardio|bw|2|m|running|ankle,knee|Heart, legs|Comfortably hard pace you could hold for about 30 minutes|Starting too fast|Steady easy run|Longer tempo block
longrun|Long easy run|cardio|bw|2|m|running|ankle,knee|Heart, legs|Slow and relaxed, finish feeling you could do more|Racing the run|Run-walk long run|Add 5 minutes
strides|Strides, 6 smooth fast runs of 20 seconds|cardio|bw|2|m|running|ankle|Legs, running form|Build up smoothly to fast but relaxed|Sprinting all out|Fewer strides|Add 2 strides
intervals|Run or walk intervals, 1 minute hard and 1 easy|cardio|bw|2|m|+running,weightloss|knee,ankle|Heart, legs|Push the hard minute to about 8 out of 10|Starting too hard|Longer easy periods|More rounds
bike|Stationary bike or ride|cardio|gym|1|m|+weightloss,running|-|Heart, legs|Keep a steady cadence and relaxed shoulders|Gripping the bars tight|Shorter ride|Add intervals
rower|Rowing machine|cardio|gym|1|m|+mma,weightloss|lowback|Heart, back, legs|Push with your legs first, then lean back, then pull|Pulling with the arms first|Shorter pieces|Interval pieces
jumprope|Jump rope|cardio|bw|1|m|+boxing,mma,weightloss|ankle,knee|Calves, heart|Small hops with wrists doing the turning|Jumping too high|Hop without a rope|Double-unders
burpee|Burpees|cardio|bw|2|m|+mma,wrestling,weightloss|wrist,knee,lowback|Whole body|Land softly and keep a steady pace|Collapsing the lower back|Step-back burpee|Burpee with a jump
mtnclimb|Mountain climbers|cardio|bw|1|t|*|wrist,shoulder|Core, shoulders, heart|Keep hips low and drive your knees steadily|Hips bouncing up|Slower pace|Faster pace
stairs|Stair or hill repeats|cardio|bw|2|m|+running,weightloss,mma|knee,ankle|Legs, heart|Climb strong and walk down to recover|Overstriding|Fewer repeats|More repeats
chesswalk|Walk between games or study blocks|cardio|bw|1|m|chess|-|Heart, legs|Walk outside if you can and look far away|Staying seated all day|Five-minute walks|Add a 10-minute walk
zone2|Zone 2 cardio, easy enough to talk|cardio|bw|1|m|+chess,weightloss|-|Heart|Keep a pace where you can hold a conversation|Going too hard|Shorter session|Longer session
catcow|Cat-cow|mobility|bw|1|t|*|wrist|Spine|Move slowly through your whole spine with each breath|Rushing|Seated version|Add a pause at each end
hip9090|90/90 hip switches|mobility|bw|1|t|*|knee|Hips|Sit tall and rotate from the hips|Collapsing the spine|Hands behind you|Lift the front foot
thoracic|Open book thoracic rotation|mobility|bw|1|t|*|-|Upper back|Follow your hand with your eyes and keep your knees stacked|Knees sliding apart|Smaller range|Pause at the end
doorchest|Doorway chest stretch|mobility|bw|1|t|*|shoulder|Chest, shoulders|Lean gently until you feel a stretch and no pinch|Arching the lower back|Lower hand position|Longer hold
hipflex|Half-kneeling hip flexor stretch|mobility|bw|1|t|*|knee|Hip flexors|Tuck your pelvis and lean forward gently|Arching the back|Pad under the knee|Raise the arm overhead
neckmob|Slow neck nods and turns|mobility|bw|1|t|+chess,bjj,wrestling|neck|Neck|Small slow movements with no strain|Forcing the range|Smaller range|Add gentle resistance with your hand
boxbreath|Box breathing, 4 in, 4 hold, 4 out, 4 hold|mobility|bw|1|t|+chess|-|Nervous system|Breathe through your nose and keep shoulders loose|Holding tension|Shorter counts|Longer counts
wallangel|Wall angels|mobility|bw|1|r|+chess|shoulder|Upper back, shoulders|Keep ribs, head and hands touching the wall|Arching the back|Smaller range|Slower reps
chintuck|Chin tuck and shoulder squeeze|mobility|bw|1|r|chess|neck|Deep neck, upper back|Glide your head straight back and squeeze your shoulder blades|Tilting the head down|Lying on your back|Hold for 5 seconds
eyerest|20-20-20 eye rest and slow breathing|mobility|bw|1|t|chess|-|Eyes, nervous system|Look 20 feet away for 20 seconds and breathe slowly|Skipping it when focused|Once an hour|Every 30 minutes
hamstretch|Hamstring stretch|mobility|bw|1|t|*|-|Hamstrings|Hinge from the hips and keep your back long|Rounding the back|Bend the knee|Longer hold
jab|Jab and cross rounds|drill|bw|1|m|boxing,mma|-|Shoulders, legs, heart|Rotate the hip and snap the hand back to your chin|Dropping the rear hand|Slow motion|Add a slip between punches
footwork|Footwork drill: step, pivot, slip|drill|bw|1|m|boxing,mma|ankle|Legs, balance|Move without crossing your feet|Standing flat-footed|Smaller steps|Add punches
slipdrill|Slip and roll drill|drill|bw|2|m|boxing|lowback|Legs, core|Bend the knees and keep your eyes up as you move|Bending at the waist|Slow motion|Add a counter punch
shadow|Shadowboxing rounds|drill|bw|1|m|boxing,mma|-|Whole body|Picture an opponent and move with a purpose|Mindless punching|Two-minute rounds|Add combinations
bagrounds|Heavy bag rounds|drill|gym|2|m|boxing,mma|wrist,shoulder|Whole body|Reset your stance after every combination|Arm punching without legs|Lighter pace|Add footwork
shrimp|Hip escape (shrimp) drill|drill|bw|1|t|bjj,mma,wrestling|-|Hips, core|Push off your feet and turn onto your hip|Staying flat on your back|Shorter distance|Add a guard recovery
bridgeroll|Bridge and roll drill|drill|bw|1|t|bjj|neck|Hips, glutes|Trap an arm and bridge over your shoulder|Cranking the neck|Bridge only|Bridge and roll to top
techstand|Technical stand-up|drill|bw|1|r|bjj,mma|knee,wrist|Hips, legs|Post one hand, lift your hips and step back to stance|Standing up with a rounded back|Slow reps|Add a wall frame
guardret|Guard retention: frames and hip movement, solo|drill|bw|2|t|bjj|-|Hips, core|Keep your knees and elbows between you and your partner|Lying flat|Slower movement|Add a partner at light pace
passfoot|Solo passing footwork: knee slide and stack|drill|bw|2|t|bjj|knee|Hips, legs|Keep your hips heavy and head up|Reaching with your arms|Slower pace|Add a partner at light pace
backctrl|Back control: seat-belt and hooks, with a partner|drill|bw|2|t|bjj|-|Grip, hips|Stay chest to back and control the top shoulder|Letting your hips drift away|Pillow or bag|Live escapes at light pace
armbar|Armbar from mount, slow reps with a partner|drill|bw|2|r|bjj,mma|elbow|Hips, legs|Control the arm, pivot and squeeze your knees together|Lifting your hips too early|Solo footwork|Finish from guard
posspar|Positional sparring rounds with a partner|drill|bw|3|m|bjj,mma,wrestling|-|Whole body|Start from one set position and play at a pace you can control|Going too hard|Shorter rounds|Add a scoring rule
stance|Stance and level-change drill|drill|bw|1|t|wrestling,mma|knee|Legs, core|Keep your hips under you and your back flat|Standing tall|Slower pace|Add hand fighting
shot|Penetration step and shot, no partner|drill|bw|2|r|wrestling,mma|knee|Legs, hips|Drop your level and drive the back knee through|Reaching with the head down|Slow motion|Add a finish
sprawl|Sprawls|drill|bw|2|r|wrestling,mma|lowback,wrist|Hips, core|Throw your hips back and down, then pop up to stance|Dropping the hips late|Step-back sprawl|Sprawl and shot
bearcrawl|Bear crawl|drill|bw|1|t|+wrestling,mma|wrist,shoulder|Shoulders, core|Move opposite hand and foot with knees just off the floor|Hips swaying|Shorter distance|Backward and lateral crawl
clinch|Clinch frames and pummeling, with a partner|drill|bw|2|m|mma,wrestling|-|Arms, core, legs|Win the inside position and keep your head up|Pulling down on the neck|Light pace|Add a takedown entry
mmacombo|Strike-to-takedown combo rounds|drill|bw|2|m|mma|knee|Whole body|Throw a combination, change levels and finish the entry|Telegraphing the shot|Slow motion|Add a sprawl reaction
boxsquat|Box squat|squat|gym|2|r|+powerlifting|knee,lowback|Quads, glutes, hips|Sit back to the box, pause without relaxing, then drive up|Plopping onto the box|Goblet box squat|Lower box
zercher|Zercher squat|squat|gym|3|r|+wrestling,mma|knee,lowback,elbow|Quads, upper back, core|Cradle the bar in your elbows and stay upright|Rounding the upper back|Goblet squat|Zercher carry
legpress|Leg press|squat|gym|1|r|+bodybuilding,weightloss|knee|Quads, glutes|Lower until your hips start to tuck and push through mid-foot|Slamming into locked knees|Lighter load|Single-leg press
heelgoblet|Heel-elevated goblet squat|squat|db|2|r|+bodybuilding|knee|Quads|Heels on a small plate and sit straight down|Knees caving inward|Goblet squat|Pause at the bottom
jumpsquat|Jump squat|squat|bw|2|r|+mma,wrestling,boxing,running|knee,ankle|Quads, glutes, power|Jump tall and land softly in a quarter squat|Landing stiff-legged|Squat with a calf raise|Pause before each jump
cossack|Cossack squat|squat|bw|2|r|+bjj,wrestling,mma|knee,hip|Adductors, quads|Shift to one side with the heel down and the other toes up|Heel lifting|Hold a support|Hold a weight at your chest
wallsit|Wall sit|squat|bw|1|t|*|knee|Quads|Back flat on the wall with thighs about parallel|Pushing on your knees with your hands|Higher position|Lower position
shrimpsq|Shrimp squat|squat|bw|3|r|calisthenics|knee|Quads, glutes|Hold your back foot and lower the knee softly to a pad|Falling forward|Hold a support|Hands free
tempogob|Tempo goblet squat, 3 seconds down|squat|db|1|r|*|knee|Quads, glutes|Count three on the way down and drive up smoothly|Rushing the lowering|Bodyweight tempo squat|Heavier weight
thruster|Dumbbell thruster|squat|db|2|r|+weightloss,mma|knee,shoulder|Legs, shoulders, heart|Squat, then use the drive to press the weights overhead|Pressing before the legs finish|Goblet squat|Heavier weights
ssbsquat|Safety bar squat|squat|gym|2|r|+powerlifting,wrestling|knee,lowback|Quads, upper back|Hands on the handles, chest up and drive through mid-foot|Folding forward|Goblet squat|Pause safety bar squat
hacksquat|Hack squat machine|squat|gym|2|r|bodybuilding|knee|Quads|Back flat on the pad and sink deep under control|Short reps|Leg press|Slow lowering
legext|Leg extension|squat|gym|1|r|+bodybuilding|knee|Quads|Squeeze at the top for a second|Swinging the weight|Lighter load|Single-leg
curtsy|Curtsy lunge|lunge|bw|1|r|+weightloss,bodybuilding|knee|Glutes, adductors|Step back across your body and keep your hips square|Twisting the torso|Smaller step|Hold dumbbells
jumplunge|Jumping lunge|lunge|bw|3|r|+mma,boxing,wrestling|knee,ankle|Quads, glutes, power|Switch legs in the air and land softly|Front knee caving in|Reverse lunge|More reps
ffesplit|Front-foot elevated split squat|lunge|db|2|r|*|knee|Quads, glutes|Front foot on a plate and the back knee to the floor|Cutting the range short|Bodyweight version|Heavier weights
skater|Skater squat|lunge|bw|3|r|+calisthenics,running|knee|Quads, glutes|Lower the back knee to a pad with your arms forward|Knee collapsing inward|Higher pad|Hold light weights
rotlunge|Lunge with rotation|lunge|bw|1|r|+mma,boxing,bjj|knee|Legs, trunk|Rotate your chest over the front leg|Losing balance|No rotation|Hold a plate
calfraise|Single-leg calf raise|lunge|bw|1|r|+running,boxing|ankle|Calves|Rise all the way up and lower for 3 seconds|Bouncing at the bottom|Both legs|Hold a dumbbell
defrevlunge|Deficit reverse lunge|lunge|db|2|r|+bodybuilding|knee|Glutes, quads|Stand on a low step and reach the back knee down|Front heel lifting|Reverse lunge|Heavier weights
goodmorning|Good morning|hinge|gym|2|r|+powerlifting|lowback|Hamstrings, back|Bar on your upper back, hips back with soft knees|Rounding the spine|Band good morning|Heavier load
bandgm|Band good morning|hinge|band|1|r|*|lowback|Hamstrings, glutes|Stand on the band, loop it behind your neck and hinge|Rounding the spine|Hip hinge drill|Heavier band
trapbar|Trap bar deadlift|hinge|gym|2|r|+mma,wrestling,bjj,weightloss|lowback|Legs, glutes, back|Stand in the middle and push the floor away|Hips shooting up first|Dumbbell Romanian deadlift|Heavier load
rackpull|Rack pull|hinge|gym|2|r|+powerlifting|lowback|Back, glutes, grip|Bar just below the knee, wedge in and stand tall|Hitching the bar up the thighs|Romanian deadlift|Lower pin height
nordic|Nordic hamstring curl|hinge|bw|3|r|+running,bjj,wrestling,mma|knee|Hamstrings|Lower as slowly as you can with your hips straight|Bending at the hips|Band-assisted Nordic|Slower lowering
slidecurl|Sliding leg curl|hinge|bw|2|r|*|knee|Hamstrings|Bridge up and slide your heels out slowly|Hips dropping|Glute bridge|Single-leg
slbridge|Single-leg glute bridge|hinge|bw|1|r|*|-|Glutes, hamstrings|Drive through one heel and keep the hips level|Hips tilting|Glute bridge|Feet elevated
hangclean|Dumbbell hang clean|hinge|db|2|r|+mma,wrestling|wrist,lowback|Hips, traps, power|Jump and shrug, then catch the weights at your shoulders|Curling the weights up|Dumbbell swing|Heavier weights
ballslam|Medicine ball slam|hinge|gym|1|r|+mma,boxing,wrestling,weightloss|lowback,shoulder|Whole body, power|Reach tall and slam hard through the floor|Rounding the back to pick it up|Lighter ball|Rotational slam
broadjump|Broad jump|hinge|bw|2|r|+mma,wrestling,running|knee,ankle,lowback|Hips, legs, power|Swing your arms, jump forward and stick the landing|Landing stiff|Jump in place|Consecutive jumps
deficitdl|Deficit deadlift|hinge|gym|3|r|powerlifting|lowback|Hamstrings, back|Stand on a low plate and keep the bar close|Hips rising first|Conventional deadlift|Bigger deficit
pausedl|Paused deadlift|hinge|gym|3|r|powerlifting|lowback|Back, hamstrings|Pause just below the knee and stay tight|Losing the brace at the pause|Conventional deadlift|Longer pause
legcurl|Lying leg curl|hinge|gym|1|r|+bodybuilding|knee|Hamstrings|Hips pinned down and lower slowly|Hips lifting|Lighter load|Single-leg
dbbench|Dumbbell bench press|push|gym|1|r|+bodybuilding|shoulder|Chest, triceps|Lower the weights to chest level with elbows at 45 degrees|Bouncing at the bottom|Floor press|Heavier weights
inclinedb|Incline dumbbell press|push|gym|2|r|+bodybuilding|shoulder|Upper chest, shoulders|Bench at about 30 degrees and press over your upper chest|Arching off the bench|Push-up|Heavier weights
closegrip|Close-grip bench press|push|gym|2|r|+powerlifting|shoulder,wrist,elbow|Triceps, chest|Hands shoulder-width and elbows tucked|Flaring the elbows|Diamond push-up|Pause at the chest
diamond|Diamond push-up|push|bw|2|r|+calisthenics|wrist,elbow|Triceps, chest|Hands together under your chest and body in one line|Hips sagging|Incline diamond push-up|Feet elevated
feetpu|Feet-elevated push-up|push|bw|2|r|*|wrist,shoulder|Upper chest, shoulders|Feet on a bench and body in one straight line|Hips piking|Push-up|Higher bench
plyopu|Plyometric push-up|push|bw|3|r|+mma,boxing|wrist,shoulder|Chest, power|Push hard enough to leave the floor and land softly|Landing with locked elbows|Fast push-up|Clap push-up
landmine|Landmine press|push|gym|2|r|+mma,wrestling,bjj|-|Shoulders, chest, core|Press up and forward in an arc with ribs down|Leaning back|Half-kneeling version|Split-stance version
arnold|Arnold press|push|db|2|r|+bodybuilding|shoulder|Shoulders|Start palms in and rotate as you press|Arching the back|Seated press|Heavier weights
benchdip|Bench dip|push|bw|1|r|*|shoulder,elbow|Triceps|Keep your back close to the bench and lower to 90 degrees|Shoulders rolling forward|Bent knees|Feet elevated
skull|Dumbbell skull crusher|push|db|2|r|+bodybuilding|elbow|Triceps|Lower the weights beside your head with elbows still|Elbows flaring out|Band pushdown|Slow lowering
flye|Dumbbell chest fly|push|db|1|r|+bodybuilding|shoulder|Chest|Soft elbows and open wide until you feel a stretch|Bending the arms into a press|Lighter weights|Pause at the stretch
pseudopl|Pseudo planche push-up|push|bw|3|r|calisthenics|wrist,shoulder|Shoulders, chest, core|Hands by your waist and lean forward over them|Hips sagging|Planche lean hold|Further lean
wallhs|Wall handstand hold|push|bw|2|t|calisthenics|wrist,shoulder|Shoulders, core|Stack wrists, shoulders and hips and push tall|Arching the lower back|Pike hold on a box|Chest to wall
hspuneg|Handstand push-up negative|push|bw|3|r|calisthenics|wrist,shoulder,neck|Shoulders, triceps|Lower slowly to a pad from a wall handstand|Collapsing fast|Pike push-up|Full handstand push-up
bandohp|Band overhead press|push|band|1|r|*|shoulder|Shoulders, triceps|Stand on the band and press straight up|Leaning back|Lighter band|Heavier band
pushpress|Push press|push|gym|3|r|+mma,wrestling|shoulder,lowback|Shoulders, legs, power|Dip at the knees and drive the bar up with your legs|Pressing with arms only|Overhead press|Heavier load
mbchest|Medicine ball chest pass|push|gym|1|r|+boxing,mma|wrist|Chest, power|Throw from your chest at a wall as fast as you can|Throwing with arms only|Lighter ball|Step into the throw
ohtricep|Overhead dumbbell triceps extension|push|db|1|r|+bodybuilding|elbow,shoulder|Triceps|Elbows point up and lower behind your head|Elbows flaring wide|Band pushdown|Slow lowering
chestpress|Machine chest press|push|gym|1|r|+bodybuilding,weightloss|shoulder|Chest, triceps|Shoulders down and press without locking hard|Shrugging up|Lighter stack|Single-arm
crow|Crow pose hold|push|bw|2|t|calisthenics|wrist|Wrists, shoulders, core|Knees on the backs of your arms and lean forward|Looking down at your feet|One foot down|Longer hold
support|Parallel bar support hold|push|bar|1|t|calisthenics|shoulder|Shoulders, triceps|Arms locked and shoulders pushed down|Shrugging up|Feet assisting|Longer hold
spoto|Spoto press|push|gym|3|r|powerlifting|shoulder|Chest, triceps|Stop the bar an inch above your chest and hold|Bouncing off the chest|Pause bench|Longer pause
bandassist|Band-assisted pull-up|pull|bar|1|r|*|shoulder|Lats, biceps|Knee in a band and pull your chest to the bar|Half reps|Lighter band|Thinner band
negpull|Negative pull-up|pull|bar|2|r|+calisthenics|shoulder,elbow|Lats, biceps|Jump to the top and lower for 4 seconds|Dropping fast|Band-assisted pull-up|Slower lowering
cablerow|Seated cable row|pull|gym|1|r|+bodybuilding|-|Mid back, lats|Chest tall and pull the handle to your belly|Rocking back|Lighter stack|Pause at the end
csrow|Chest-supported dumbbell row|pull|db|1|r|*|-|Upper back|Chest on an incline bench and row to your hips|Shrugging|Lighter weights|Pause at the top
ropeclimb|Towel pull-up|pull|bar|3|r|+bjj,wrestling,mma|elbow,shoulder|Grip, lats|Hang a towel over the bar and pull while squeezing|Losing the grip early|Towel hang|Two towels
hammer|Hammer curl|pull|db|1|r|+bodybuilding,bjj|elbow|Forearms, biceps|Palms face each other and elbows stay still|Swinging|Lighter weights|Slow lowering
reardelt|Rear delt fly|pull|db|1|r|+bodybuilding,boxing|-|Rear delts|Hinge forward and lift with soft elbows|Shrugging|Band pull-apart|Pause at the top
pullapart|Band pull-apart|pull|band|1|r|*|-|Rear delts, upper back|Arms straight and squeeze the shoulder blades|Arching the back|Lighter band|Slower tempo
towelrow|Towel inverted row|pull|bw|2|r|bjj,wrestling|elbow|Grip, upper back|Loop towels over a bar and row like a gi grip|Hips sagging|Inverted row|Feet elevated
tuckfl|Tuck front lever hold|pull|bar|3|t|calisthenics|shoulder|Lats, core|Pull the bar toward your hips with a rounded back|Bent arms|Scapular pull-up|Open the tuck
shrug|Dumbbell shrug|pull|db|1|r|+bodybuilding,wrestling|neck|Traps|Lift straight up and pause|Rolling the shoulders|Lighter weights|Pause at the top
renegade|Renegade row|pull|db|2|r|+mma,weightloss|wrist,lowback|Back, core|Wide feet and row without twisting|Rotating the hips|Knees down|Heavier weights
skinthecat|Tucked skin the cat|pull|bar|3|r|calisthenics|shoulder|Shoulders, lats, core|Tuck tight and rotate slowly through|Dropping into the stretch|Hanging knee raise|German hang hold
inclinecurl|Incline dumbbell curl|pull|db|2|r|bodybuilding|elbow|Biceps|Arms hang behind you and curl without moving the elbows|Swinging|Standing curl|Slow lowering
platepinch|Plate pinch hold|grip|gym|1|t|+bjj,wrestling|-|Fingers, grip|Pinch two smooth plates together and stand tall|Bending the wrist|Lighter plates|Heavier plates
wristroller|Wrist roller|grip|gym|1|r|+bjj|elbow,wrist|Forearms|Roll the weight up and down under control|Using the shoulders|Lighter weight|Heavier weight
gipullup|Gi grip pull-up|grip|bar|3|r|bjj|elbow,shoulder|Grip, lats|Grab a gi or towel and pull with tight fists|Kipping|Gi grip hang|Add weight
suitcase|Suitcase carry|grip|db|1|t|*|-|Grip, obliques|One weight at your side and walk without leaning|Leaning toward the weight|Lighter weight|Heavier weight
towelwring|Towel wring and squeeze|grip|bw|1|t|+bjj,wrestling|wrist|Forearms|Twist a towel hard in both directions|Holding your breath|Lighter squeeze|Wet towel
deadhang|Dead hang|grip|bar|1|t|*|shoulder|Grip, shoulders|Hang with relaxed shoulders and steady breath|Swinging|Feet touching|Single arm
neckflex|Band neck flexion, slow and small|neck|band|1|r|+wrestling,bjj,mma|neck|Neck flexors|Tuck the chin and nod against light tension|Jerking the head|Hand resistance|Slightly heavier band
neckext|Band neck extension, slow and small|neck|band|1|r|+wrestling,bjj,mma|neck|Neck extensors|Look up slowly against light tension|Cranking the neck back|Hand resistance|Slightly heavier band
neckiso|Neck isometrics with your hand|neck|bw|1|t|+wrestling,bjj,mma,boxing|neck|Neck|Press your head into your hand at about half effort, all four directions|Pushing too hard|Shorter holds|Longer holds
frontbridge|Front neck bridge, hands assisted|neck|bw|3|t|wrestling,bjj|neck,lowback|Neck, back|Forehead on a soft mat with your hands taking most of the weight|Rolling onto the top of the head|Neck isometrics|Less hand support
abwheel|Ab wheel rollout|core|gym|2|r|+mma,bjj,wrestling|lowback,shoulder|Abs, lats|Ribs down and roll out only as far as you can control|Back sagging|From the knees, short range|Longer range
hanglegraise|Hanging leg raise|core|bar|3|r|+calisthenics|shoulder|Abs, hip flexors|Straight legs and curl the pelvis up|Swinging|Hanging knee raise|Toes to bar
lsit|L-sit tuck hold|core|bw|2|t|calisthenics|wrist|Abs, triceps|Push the floor or parallettes away and lift your knees|Shrugging|Feet on the floor|Straight legs
copenhagen|Copenhagen side plank|core|bw|2|t|+bjj,wrestling,mma,running|knee,hip|Adductors, obliques|Top leg on a bench and lift your hips|Hips dropping|Knee on the bench|Longer hold
woodchop|Band woodchop|core|band|1|r|+boxing,mma|-|Obliques|Rotate from the hips and keep your arms long|Bending the arms|Lighter band|Heavier band
mbrot|Medicine ball rotational throw|core|gym|2|r|+boxing,mma|lowback|Rotational power|Load the back hip and throw at a wall|Throwing with the arms|Lighter ball|Step into the throw
revcrunch|Reverse crunch|core|bw|1|r|*|-|Lower abs|Curl your hips off the floor slowly|Swinging the legs|Smaller range|Slower tempo
vup|V-up|core|bw|2|r|+calisthenics,mma|lowback|Abs|Reach for your toes as both ends rise|Jerking up|Tuck-up|Slow lowering
bearplank|Bear plank hold|core|bw|1|t|*|wrist|Core, shoulders|Knees one inch off the floor and back flat|Hips rising|Shorter hold|Add shoulder taps
hollowrock|Hollow rock|core|bw|2|r|+calisthenics,bjj|-|Abs|Hold the hollow shape and rock as one piece|Bending at the hips|Hollow hold|Longer sets
shouldertap|Plank shoulder taps|core|bw|1|r|*|wrist|Core, shoulders|Wide feet and keep the hips still|Hips rocking|Knees down|Narrow feet
getup|Turkish get-up|core|db|3|r|+bjj,mma,wrestling|shoulder,wrist|Whole body, shoulder stability|Eyes on the weight and move one step at a time|Rushing the steps|Get-up without weight|Heavier weight
assault|Air bike sprints|cardio|gym|3|m|+mma,wrestling,weightloss|-|Heart, whole body|Hard 20 seconds, easy 40, and repeat|Going out too hard|Fewer rounds|More rounds
swim|Swimming|cardio|gym|1|m|+weightloss,running,mma|shoulder|Heart, whole body|Long smooth strokes and steady breathing|Holding your breath|Shorter swim|Add intervals
elliptical|Elliptical|cardio|gym|1|m|+weightloss,running|-|Heart, legs|Steady pace and tall posture|Leaning on the handles|Shorter session|Add intervals
sled|Sled push|cardio|gym|2|m|+mma,wrestling,weightloss|knee|Legs, heart|Low body angle and drive with short steps|Standing upright|Lighter sled|Heavier sled
hillsprint|Hill sprints|cardio|bw|3|m|+running,mma,wrestling|ankle,knee|Legs, heart, power|Sprint up for 10 seconds and walk down fully recovered|Sprinting when tired|Fast hill walk|More repeats
fartlek|Fartlek run|cardio|bw|2|m|running|ankle,knee|Heart, legs|Mix short faster bursts into an easy run by feel|Turning it into a race|Easy run|Longer bursts
recjog|Recovery jog|cardio|bw|1|m|running|ankle,knee|Heart, legs|Slower than easy, just to loosen up|Speeding up|Walk-jog|Slightly longer
ruck|Rucking with a weighted pack|cardio|bw|1|m|+weightloss|lowback,knee|Heart, legs, back|Walk tall with a snug pack|Leaning forward|Lighter pack|Heavier pack or hills
lowimpact|Low-impact cardio circuit|cardio|bw|1|m|+weightloss,chess|-|Heart, whole body|March, step jacks and squats with no jumping|Rushing|Fewer rounds|More rounds
shuttle|Shuttle runs|cardio|bw|2|m|+mma,wrestling,boxing|ankle,knee|Legs, heart|Touch the line, turn low and drive out|Turning tall|Walk the turns|More shuttles
ropes|Battle rope intervals|cardio|gym|2|m|+mma,boxing,weightloss|shoulder|Arms, heart|Athletic stance and make waves from the hips|Standing tall|Shorter rounds|Longer rounds
inclinewalk|Incline treadmill walk|cardio|gym|1|m|+weightloss,chess|-|Heart, legs|Walk without holding the rails|Hanging on the handrails|Lower incline|Higher incline
play|Recreational sport or active play|cardio|bw|1|m|+weightloss|-|Heart, whole body|Pick something fun that keeps you moving|Treating it as a test|Shorter session|Longer session
stepjack|Step jacks|cardio|bw|1|t|+weightloss,chess|-|Heart|Step out to the side while raising your arms|Holding your breath|Arms only|Jumping jacks
wgs|World's greatest stretch|mobility|bw|1|t|*|-|Hips, upper back|Lunge, drop the elbow to the instep, then rotate open|Rushing through it|Smaller range|Add a hamstring rock
pigeon|Pigeon stretch|mobility|bw|1|t|*|knee,hip|Glutes, hips|Square your hips and breathe into the stretch|Twisting the knee|Figure-four on your back|Longer hold
couch|Couch stretch|mobility|bw|2|t|+running,bjj|knee|Hip flexors, quads|Back knee against the wall and squeeze the glute|Arching the lower back|Half-kneeling hip stretch|Torso upright
anklerock|Ankle rocks, knee over toes|mobility|bw|1|r|+running,powerlifting|-|Ankles|Drive the knee forward with the heel down|Heel lifting|Smaller range|Add a pause
dislocate|Band shoulder pass-through|mobility|band|1|r|*|shoulder|Shoulders, chest|Wide grip and move slowly over your head|Bending the elbows|Wider grip|Narrower grip
threadneedle|Thread the needle|mobility|bw|1|t|*|-|Upper back|On hands and knees, reach one arm under and then open up|Moving the hips|Smaller range|Pause at the end
frog|Frog stretch|mobility|bw|1|t|+bjj,wrestling|hip,knee|Adductors, hips|Knees wide and rock slowly back|Forcing the range|Narrower knees|Longer hold
butterfly|Butterfly stretch|mobility|bw|1|t|+bjj|hip|Adductors|Sit tall and let your knees fall open|Rounding the back|Sit on a cushion|Lean forward
wristmob|Wrist mobility circuit|mobility|bw|1|t|+calisthenics,bjj,boxing|-|Wrists, forearms|Rock gently on your palms in all directions|Forcing painful ranges|Seated version|Longer holds
childpose|Child's pose with side reach|mobility|bw|1|t|*|knee|Lats, back|Walk your hands to one side and breathe|Holding your breath|Pillow under the hips|Longer hold
calfstretch|Calf stretch at a wall|mobility|bw|1|t|+running|-|Calves|Back heel down and lean in|Turning the foot out|Smaller lean|Bent-knee version
foamroll|Foam roll quads, calves and upper back|mobility|bw|1|t|*|-|Whole body|Roll slowly and pause on tight spots|Rolling the lower back|Shorter session|Longer pauses
deepsquat|Deep squat hold|mobility|bw|1|t|*|knee,ankle|Hips, ankles|Hold onto a post and sit tall at the bottom|Rounding the back|Heels on a plate|Hands free
hipairplane|Hip airplanes|mobility|bw|2|r|+bjj,mma|hip|Hips, balance|Balance on one leg and rotate your pelvis open and closed|Twisting the spine|Hold a wall|Slower reps
legswall|Legs up the wall breathing|mobility|bw|1|t|+chess,running|-|Nervous system|Lie with legs on the wall and breathe slowly|Fidgeting|Shorter hold|Longer hold
sigh|Physiological sigh breathing|mobility|bw|1|t|+chess,mma,boxing|-|Nervous system|Two inhales through the nose, one long exhale|Rushing breaths|Fewer rounds|More rounds
wallstand|Posture reset against a wall|mobility|bw|1|t|chess|-|Upper back, posture|Heels, hips, back and head touch the wall|Arching the lower back|Shorter hold|Arms overhead
runform|Running form drills: A-skips and high knees|mobility|bw|1|t|running|ankle,knee|Legs, running form|Tall posture and quick feet|Leaning back|Marching version|Longer distance
granby|Granby roll|drill|bw|2|r|bjj,wrestling|neck,lowback|Spine, shoulders|Roll over the shoulder, never the neck, with knees tucked|Rolling onto the head|Shoulder roll|Granby to guard
inversion|Inversion drill|drill|bw|3|r|bjj|neck,lowback|Spine, hips|Shoulders on the mat and hips turn over your head|Weight on the neck|Shoulder stand|Invert to a guard
kneecut|Knee cut pass reps with a partner|drill|bw|2|r|bjj,mma|knee|Hips, legs|Crossface and underhook before you slide the knee|Leaning back on the slide|Slow reps|Partner gives light resistance
toreando|Toreando pass reps with a partner|drill|bw|2|r|bjj|-|Legs, grip|Push the knees to the mat and step around fast|Standing too tall|Slow reps|Partner frames lightly
scissor|Scissor sweep reps|drill|bw|1|r|bjj|knee|Hips, legs|Pull them onto your shin and chop the leg|Not off-balancing first|Slow reps|From a grip fight
hipbump|Hip bump sweep reps|drill|bw|1|r|bjj,mma|-|Hips, core|Sit up on your elbow and drive your hip into them|Staying flat|Slow reps|Chain to kimura
elbowknee|Elbow-knee escape from mount|drill|bw|1|r|bjj,mma|-|Hips, core|Frame, shrimp and slide the knee under|Pushing with straight arms|Slow reps|Partner holds mount loosely
sideesc|Side control escape to guard|drill|bw|1|r|bjj,mma|-|Hips, core|Frames on the neck and hip, shrimp, then the knee in|Turning toward them flat|Slow reps|Partner applies light pressure
rnc|Rear naked choke finish reps|drill|bw|1|r|bjj,mma|neck|Arms, back|Elbow under the chin, hand to biceps, head beside theirs|Squeezing on the jaw|Slow reps|From a moving back take
triangle|Triangle from guard reps|drill|bw|2|r|bjj,mma|knee,neck|Hips, legs|One arm in, one out, then cut the angle|Squaring up|Slow reps|From a posture break
kimura|Kimura from side control|drill|bw|1|r|bjj,mma|shoulder|Arms, hips|Figure-four grip and walk around the head|Cranking fast|Slow reps|Chain to an armbar
anklelock|Straight ankle lock entries, slow finish|drill|bw|2|r|bjj|knee,ankle|Legs, grip|Foot deep in the armpit, then arch slowly|Finishing fast|Entries only|From a standing opponent
ashi|Ashi garami entries and heel line control, no finishing torque|drill|bw|3|r|bjj|knee,ankle|Hips, legs|Knees pinched and hips close to theirs|Leaving space at the hips|Entries only|Partner tries light escapes
guillo|Front headlock to guillotine|drill|bw|2|r|bjj,wrestling,mma|neck|Arms, back|Wrist under the chin and close the elbow tight|Pulling with the arms only|Grip only|From a snap-down
butterflysw|Butterfly sweep reps|drill|bw|2|r|bjj|-|Hips, legs|Underhook, lean to the side and lift with the hook|Sitting up straight|Slow reps|From a grip fight
flowroll|Flow rolling at 30 percent|drill|bw|1|m|bjj|-|Whole body|Move constantly and let your partner move too|Speeding up|Shorter rounds|Longer rounds
mountret|Mount retention: hip switch and grapevine|drill|bw|2|t|bjj,mma|-|Hips, core|Heavy hips and hands post wide when they bridge|Sitting tall when they bridge|Slow reps|Partner escapes at light pace
kob|Knee-on-belly transitions|drill|bw|2|t|bjj|knee|Hips, balance|Knee on the belly, far leg wide, and switch sides|Leaning too far forward|Slow reps|Partner moves under you
handfight|Hand fighting rounds|drill|bw|1|m|wrestling,mma|-|Arms, grip|Clear their hands and win inside position|Reaching with your head down|Slow pace|Add a shot after a win
sitout|Sit-out and turn in from bottom|drill|bw|2|r|wrestling|lowback|Hips, core|Hand control first, then sit out and turn to face|Leaving your hands behind|Slow reps|Partner adds pressure
snapdown|Snap-down to go-behind|drill|bw|2|r|wrestling,mma|neck|Arms, legs|Snap the head down and spin behind with your chest heavy|Letting the head go|Slow reps|From a collar tie
runpipe|Double-leg finish: run the pipe|drill|bw|2|r|wrestling,mma|knee|Legs, hips|Head on the outside and turn the corner|Driving straight in|Slow reps|From a level change
highcrotch|High crotch finish reps|drill|bw|2|r|wrestling|knee|Legs, hips|Head inside, lift the leg and turn the corner|Head down in the middle|Slow reps|From a shot
standup|Stand-up from referee's position|drill|bw|2|r|wrestling,mma|lowback|Hips, legs|Hand control, then the outside foot steps up and you stand|Leaving hands free for them|Slow reps|Partner rides at light pace
anklepick|Ankle pick reps|drill|bw|2|r|wrestling|-|Legs, timing|Pull the head to load the leg, then pick the ankle|Reaching without setup|Slow reps|From a snap-down
cagewalk|Cage wall stand-up, wall walk|drill|bw|2|r|mma|lowback,knee|Hips, legs|Back to the wall, post a hand and walk up the wall|Standing straight up into a headlock|Slow reps|Partner adds pressure
reflex|Partner pad touches and reflex drill|drill|bw|2|m|boxing,mma|-|Hands, eyes|Return fast to guard after every touch|Dropping the rear hand|Slow pace|Add head movement
mitts|Mitt work rounds with a partner|drill|bw|2|m|boxing,mma|wrist,shoulder|Whole body|Snap the punches and reset your feet|Arm punching|Shorter rounds|Add defense
bodyshot|Body shot and level change drill|drill|bw|2|m|boxing|lowback|Legs, core|Bend the knees to change levels, not the waist|Bending at the waist|Slow motion|Add a hook to the head
pivot|Pivot and angle exits|drill|bw|1|m|boxing,mma|ankle|Legs, balance|Pivot on the lead foot after the combination|Crossing your feet|Slow steps|Add punches
shell|Defensive shell and parry drill|drill|bw|1|m|boxing,mma|-|Arms, eyes|Elbows tight and eyes up behind the gloves|Turning away|Slow partner punches|Add a counter
counter|Slip and return counterpunch drill|drill|bw|2|m|boxing|-|Whole body|Slip the jab and fire the cross from the loaded hip|Leaning too far|Slow motion|Add a hook
gnp|Ground and pound posture drill on a bag|drill|gym|2|m|mma|wrist,lowback|Whole body|Posture up, hips heavy and short strikes|Overreaching|Slow pace|Add a pass
cageclinch|Cage clinch: underhooks and wall pressure|drill|bw|2|m|mma|-|Whole body|Head under their chin and hips close|Pushing with straight arms|Light pace|Add a takedown
kneeelbow|Knees and elbows on the bag|drill|gym|2|m|mma|knee,elbow|Whole body|Clinch the bag and drive the knee from the hip|Leaning back|Slow pace|Add footwork
tddefense|Takedown defense: sprawl and circle off|drill|bw|2|r|mma,wrestling|lowback|Hips, core|Hips back, crossface, then circle to the open side|Staying on your knees|Slow reps|Partner shoots at light pace
kickcatch|Kick catch and counter|drill|bw|2|r|mma|-|Arms, legs|Trap the kick high and step to counter|Catching with the hands only|Slow reps|Add a sweep
teep|Teep and low kick on the bag|drill|gym|2|m|mma|knee,hip|Legs, hips|Turn the hip over on the kick and recover your stance|Leaning back too far|Slow pace|Combinations into kicks
`;
CM.EX=RAW.trim().split("\n").map(function(l){
  const f=l.split("|"),plus=f[6][0]==="+",sp=f[6]==="*"?[]:f[6].replace("+","").split(",");
  return {id:f[0],name:f[1],pat:f[2],eq:f[3],d:+f[4],u:f[5],sp:sp,all:f[6]==="*"||plus,
    avoid:f[7]==="-"?[]:f[7].split(","),mus:f[8],cue:f[9],err:f[10],reg:f[11],prog:f[12]||""};
});
CM.EXM=Object.fromEntries(CM.EX.map(function(e){return [e.id,e];}));
})(globalThis.CM=globalThis.CM||{});
