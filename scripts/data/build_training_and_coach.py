"""Builds exercises.json, rehab.json and coach.json (14 coach questions).
Coach answers are educational, never diagnoses, never promises."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parents[2]/"NutraCore/Sources/NutraCore/Resources"
GYM, DB, BW = "gym", "dumbbells", "bodyweight"
E = [
("goblet-squat","Goblet squat","squat",[DB,GYM],"Hold a weight at your chest, sit down between your heels, stand tall."),
("back-squat","Barbell back squat","squat",[GYM],"Bar on upper back, brace, sit down and back, drive up through the whole foot."),
("bodyweight-squat","Bodyweight squat","squat",[BW,DB,GYM],"Feet shoulder-width, sit back like into a chair, stand up."),
("romanian-deadlift","Romanian deadlift","hinge",[DB,GYM],"Soft knees, push hips back with a flat back, feel the hamstrings, stand up."),
("hip-bridge","Glute bridge","hinge",[BW,DB,GYM],"Lie on your back, feet flat, squeeze your glutes to lift hips, lower slowly."),
("trap-bar-deadlift","Trap bar deadlift","hinge",[GYM],"Stand inside the bar, brace, push the floor away."),
("reverse-lunge","Reverse lunge","lunge",[BW,DB,GYM],"Step back, lower the back knee toward the floor, push through the front foot."),
("step-up","Step-up","lunge",[BW,DB,GYM],"Step onto a sturdy box or stair, stand tall, step down with control."),
("push-up","Push-up","pushHorizontal",[BW,DB,GYM],"Hands under shoulders, body in a line, lower your chest, push back up. Knees down is fine."),
("db-bench","Dumbbell bench press","pushHorizontal",[DB,GYM],"Lie on a bench, press dumbbells up over your chest, lower with control."),
("bench-press","Barbell bench press","pushHorizontal",[GYM],"Eyes under the bar, lower to mid-chest, press up. Use a spotter."),
("pike-push-up","Pike push-up","pushVertical",[BW],"Hips high, bend elbows to bring your head toward the floor, press back."),
("db-shoulder-press","Dumbbell shoulder press","pushVertical",[DB,GYM],"Press dumbbells overhead without arching your back."),
("db-row","One-arm dumbbell row","pullHorizontal",[DB,GYM],"Hand on a bench, pull the dumbbell to your hip, lower slowly."),
("cable-row","Seated cable row","pullHorizontal",[GYM],"Sit tall, pull the handle to your belly, squeeze shoulder blades."),
("towel-row","Table or towel row","pullHorizontal",[BW],"Under a sturdy table, pull your chest up to the edge. Or pull a towel looped around a door handle."),
("lat-pulldown","Lat pulldown","pullVertical",[GYM],"Pull the bar to your upper chest, elbows down and back."),
("band-pulldown","Band or doorway pull","pullVertical",[BW,DB],"Pull a band down from overhead, or do slow doorway pulls."),
("plank","Plank","core",[BW,DB,GYM],"Forearms down, body straight, breathe. Hold 20 to 40 seconds."),
("dead-bug","Dead bug","core",[BW,DB,GYM],"On your back, lower opposite arm and leg slowly while keeping your back flat."),
("farmer-carry","Farmer carry","carry",[DB,GYM],"Hold heavy weights at your sides and walk tall for 30 to 40 steps."),
("suitcase-carry","Bag carry","carry",[BW],"Carry a full bag or backpack in one hand, walk tall, switch hands."),
]
json.dump([{"id":a,"name":b,"pattern":c,"equipment":d,"howTo":e} for a,b,c,d,e in E], open(root/"exercises.json","w"), indent=1)
RF = ["Pain that wakes you at night","Numbness, tingling or weakness","Swelling, redness or heat","A fall, crash or pop at the time of injury"]
H = [
("lower-back","Lower back",["Walking 10 minutes","Cat-cow stretch, slow","Glute bridge, small range","Child's pose, breathing slowly"]),
("knee","Knee",["Straight-leg raise","Wall sit, high and short","Step-ups on a low step","Calf raises"]),
("shoulder","Shoulder",["Pendulum swings","Wall slides","Band pull-aparts, light","Doorway chest stretch, gentle"]),
("ankle","Ankle",["Ankle circles","Alphabet with your toes","Calf raises, two feet","Balance on one foot near a wall"]),
("neck","Neck",["Chin tucks","Slow side tilts","Shoulder rolls","Gentle turns left and right"]),
("hip","Hip",["Clamshells","Glute bridge","Hip flexor stretch, gentle","Side-lying leg raise"]),
]
json.dump([{"id":a,"name":b,"moves":c,"redFlags":RF} for a,b,c in H], open(root/"rehab.json","w"), indent=1)
C = [
("protein-amount","How much protein do I need?",["protein","how much protein"],"Most adults do well with some protein at each meal: eggs, yogurt, beans, tofu, fish or meat. If you train hard, a little more helps recovery. Your starting number in Nutra is an estimate, not a rule."),
("fiber","How can I eat more fiber?",["fiber","fibre","digestion","constipation"],"Add one plant at a time: oats at breakfast, beans in a soup, fruit as a snack. Increase slowly and drink water alongside so your gut can adjust."),
("snacks","What's a good snack?",["snack","snacks","hungry"],"A snack that pairs protein or fat with fiber keeps you full longer: an apple with peanut butter, yogurt with fruit, hummus with carrots, or a handful of nuts."),
("breakfast","Do I need breakfast?",["breakfast","skip","morning"],"Not everyone does. Some people feel better eating in the morning, others later. What matters most is how you feel and how your whole day comes together."),
("water","How much water should I drink?",["water","hydration","drink","thirsty"],"Needs vary with size, weather and activity. A simple guide is pale yellow urine and drinking when thirsty. Food, tea and coffee count too."),
("sleep","Can food help me sleep?",["sleep","tired","night","insomnia"],"A regular meal pattern, less caffeine after midday and not going to bed very full or very hungry can help. Sleep habits matter more than any single food."),
("sugar","Is sugar bad?",["sugar","sweet","sweets","dessert"],"No food is forbidden. Added sugar is easiest to enjoy alongside a meal rather than alone. Swapping one sugary drink for water is a small, easy change."),
("carbs","Are carbs bad?",["carbs","carb","bread","rice","pasta"],"Carbs are the body's main fuel, especially for exercise. Whole grains, fruit, beans and potatoes also bring fiber and vitamins. Pairing carbs with protein keeps energy steady."),
("after-workout","What should I eat after a workout?",["workout","after","recovery","training","gym"],"A meal or snack with protein and carbs within a few hours helps recovery: yogurt and fruit, a chicken and rice bowl, or eggs on toast."),
("eating-out","How do I eat out and stay on track?",["restaurant","eating","out","takeaway","takeout"],"Enjoy it. Look for a dish with protein and vegetables, share a side if you like, and stop when you're comfortably full. One meal never undoes your progress."),
("plateau","My weight isn't changing. What now?",["plateau","stuck","weight","changing","scale"],"Day-to-day weight jumps around with water and salt. Nutra looks at two-week trends. If things are stable for longer, review your goal in Profile, or simply enjoy maintaining."),
("cravings","How do I handle cravings?",["craving","cravings","hungry","urge"],"Cravings are normal. Eating regular meals with protein and fiber helps. If you want the food, have a portion you enjoy, without guilt."),
("vegetarian-protein","How do vegetarians get protein?",["vegetarian","vegetarians","vegan","plant","plants","tofu","beans"],"Beans, lentils, tofu, tempeh, eggs, dairy, nuts and seeds all bring protein. Having a few of these through the day covers most needs."),
("meal-prep","How do I start meal prep?",["prep","batch","plan","planning","cook"],"Start small: cook one grain, one protein and one tray of vegetables on a quiet day. Mix them into different meals through the week. The Meals section can build a shopping list."),
]
assert len(C) == 14
json.dump([{"id":a,"question":b,"keywords":c,"answer":d} for a,b,c,d in C], open(root/"coach.json","w"), indent=1)
print("wrote", len(E), "exercises,", len(H), "rehab areas,", len(C), "coach answers")
