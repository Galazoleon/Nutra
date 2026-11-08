"""Builds goals.json: 37 goals in 6 categories. Data-only; edit and re-run.
Gentle modules must never include 'energy', 'macros' or 'weightTrend'."""
import json, pathlib
G = []
def g(id, title, cat, blurb, direction="none", adj=0, ppk=1.0, mods=None, gentle=None, combat=False, weeks=None, pop=False):
    G.append({"id":id,"title":title,"category":cat,"blurb":blurb,"direction":direction,
              "calorieAdjustPercent":adj,"proteinPerKg":ppk,"modules":mods,"gentleModules":gentle,
              "isCombatSport":combat,"weeks":weeks,"isPopular":pop})
# body
g("lose-weight","Lose weight steadily","body","A slow, steady pace with filling meals.","lose",-15,1.6,["energy","protein","weightTrend","fiber"],["meals","protein","plants","tip"],pop=True)
g("lose-weight-gently","Lose weight gently","body","An even smaller change, focused on habits.","lose",-10,1.4,["energy","plants","weightTrend","tip"],["meals","plants","foodGroups","tip"])
g("build-muscle","Build muscle","body","Enough food and protein to grow stronger.","gain",8,1.8,["protein","energy","training","weightTrend"],["protein","training","meals","tip"],pop=True)
g("gain-weight","Gain weight","body","Add energy with easy, satisfying extras.","gain",12,1.4,["energy","meals","protein","weightTrend"],["meals","protein","foodGroups","tip"])
g("maintain","Keep my weight steady","body","Eat well without changing your weight.","maintain",0,1.2,["energy","macros","foodGroups","tip"],["meals","foodGroups","plants","tip"],pop=True)
g("recomposition","Lose fat, keep muscle","body","Small change in energy, plenty of protein and training.","lose",-8,2.0,["protein","energy","training","weightTrend"],["protein","training","meals","tip"])
# sport
g("running","Running and endurance","sport","Fuel for longer runs and good recovery.","maintain",5,1.4,["energy","macros","training","tip"],["meals","training","foodGroups","tip"],pop=True)
g("cycling","Cycling","sport","Carbs for the ride, protein for the legs.","maintain",5,1.4,["energy","macros","training","tip"],["meals","training","foodGroups","tip"])
g("swimming","Swimming","sport","Steady energy for the pool.","maintain",5,1.4,["energy","macros","training","tip"],["meals","training","foodGroups","tip"])
g("team-sports","Team sports","sport","Football, basketball and more: fuel for game day.","maintain",5,1.5,["energy","macros","training","tip"],["meals","training","protein","tip"])
g("strength-sports","Lifting and strength","sport","Protein and energy for heavy training.","maintain",5,1.8,["protein","energy","training","macros"],["protein","training","meals","tip"])
g("combat-sports","Combat sports","sport","Boxing, martial arts and wrestling, without risky cuts.","maintain",0,1.8,["energy","protein","training","tip"],["meals","protein","training","tip"],combat=True)
g("yoga-mobility","Yoga and mobility","sport","Light, balanced eating around practice.","maintain",0,1.2,["foodGroups","plants","training","tip"],["foodGroups","plants","training","tip"])
g("hiking","Hiking and outdoors","sport","Snacks and meals for long days outside.","maintain",5,1.3,["energy","meals","training","tip"],["meals","training","foodGroups","tip"])
# health
g("more-energy","More energy","health","Steady meals that keep you going.","none",0,1.2,["meals","fiber","protein","tip"],["meals","protein","fiber","tip"],pop=True)
g("better-sleep","Better sleep","health","Meal timing and foods that help you wind down.","none",0,1.0,["meals","tip","foodGroups"],["meals","tip","foodGroups"])
g("digestion","Better digestion","health","More fiber, more variety, gentle changes.","none",0,1.0,["fiber","plants","meals","tip"],["fiber","plants","meals","tip"])
g("heart-health","Heart health","health","More plants, fish and healthy fats.","none",0,1.0,["plants","fiber","foodGroups","tip"],["plants","fiber","foodGroups","tip"])
g("steady-blood-sugar","Steadier blood sugar","health","Pair carbs with protein and fiber.","none",0,1.2,["fiber","protein","meals","tip"],["fiber","protein","meals","tip"])
g("bone-health","Strong bones","health","Calcium, vitamin D and movement.","none",0,1.2,["foodGroups","training","tip"],["foodGroups","training","tip"])
g("more-plants","Eat more plants","health","More fruit, vegetables, beans and grains.","none",0,1.0,["plants","fiber","foodGroups","tip"],["plants","fiber","foodGroups","tip"],pop=True)
g("less-sugar","Less added sugar","health","Simple swaps, no banned foods.","none",0,1.0,["meals","fiber","tip"],["meals","fiber","tip"])
g("hydration","Drink more water","health","Small reminders to sip through the day.","none",0,1.0,["meals","tip"],["meals","tip"])
g("healthy-aging","Healthy aging","health","Protein, bones and variety as you get older.","none",0,1.2,["protein","foodGroups","plants","tip"],["protein","foodGroups","plants","tip"])
# programs
g("four-week-reset","4-week fresh start","program","One small habit a week for a month.","none",0,1.2,["meals","plants","tip"],["meals","plants","tip"],weeks=4)
g("eight-week-strength","8-week strength block","program","Train and eat for strength for two months.","maintain",5,1.8,["training","protein","energy","tip"],["training","protein","meals","tip"],weeks=8)
g("twelve-week-steady-loss","12-week steady change","program","A gentle, steady three months.","lose",-12,1.6,["energy","protein","weightTrend","tip"],["meals","protein","plants","tip"],weeks=12)
g("thirty-day-cooking","30 days of home cooking","program","Cook more of your own meals for a month.","none",0,1.0,["meals","foodGroups","tip"],["meals","foodGroups","tip"],weeks=4)
# life
g("custom","My own goal","life","Set your own focus. Nutra keeps things balanced.","none",0,1.2,["meals","foodGroups","tip"],["meals","foodGroups","tip"])
g("family-meals","Feed my family","life","Meals the whole household can share.","none",0,1.0,["meals","foodGroups","tip"],["meals","foodGroups","tip"])
g("my-culture","Eat the food I grew up with","life","Keep your cuisine, eat it your way.","none",0,1.0,["meals","foodGroups","plants","tip"],["meals","foodGroups","plants","tip"])
g("budget","Eat well on a budget","life","Cheaper staples that still nourish.","none",0,1.0,["meals","foodGroups","tip"],["meals","foodGroups","tip"])
g("cook-more","Learn to cook","life","Simple recipes with step-by-step help.","none",0,1.0,["meals","tip","foodGroups"],["meals","tip","foodGroups"])
g("meal-prep","Prep meals ahead","life","Batch cooking for busy weeks.","none",0,1.2,["meals","protein","tip"],["meals","protein","tip"])
g("eat-out","Eat out smarter","life","Enjoy restaurants and takeaway with easy tips.","none",0,1.0,["meals","foodGroups","tip"],["meals","foodGroups","tip"])
# explore
g("explore-world","Explore world foods","explore","Discover dishes from around the world.","none",0,1.0,["meals","plants","tip"],["meals","plants","tip"])
g("just-track","Just see what I eat","explore","No goal yet. Log and learn.","none",0,1.0,["meals","foodGroups","tip"],["meals","foodGroups","tip"],pop=True)
assert len(G) == 37, len(G)
path = pathlib.Path(__file__).resolve().parents[2]/"NutraCore/Sources/NutraCore/Resources/goals.json"
path.write_text(json.dumps(G, indent=1)+"\n"); print("wrote", len(G), "goals")
