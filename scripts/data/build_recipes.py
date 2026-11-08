"""Builds recipes.json: 32 recipes. Nutrients per serving are ESTIMATES.
Ingredient tuple: (name, amount, unit, aisle)."""
import json, pathlib
R = []
MED, CAR, PES, VEG = "mediterranean", "carnivore", "pescatarian", "vegetarian"
def r(id, name, slots, mins, oven, diets, allergens, n, ingr, steps, swap=None):
    k,p,c,f,fi = n
    R.append({"id":id,"name":name,"slots":slots,"minutes":mins,"needsOven":oven,"diets":diets,
              "allergens":allergens,"nutrients":{"calories":k,"protein":p,"carbs":c,"fat":f,"fiber":fi,"micros":{}},
              "ingredients":[{"name":a,"amount":b,"unit":u,"aisle":s} for a,b,u,s in ingr],
              "steps":steps,"swapTip":swap})
P,D,G,M,PA,F = "Produce","Dairy and eggs","Grains and bread","Meat and fish","Pantry","Frozen"
# breakfasts
r("overnight-oats","Overnight oats with berries",["breakfast"],5,False,[MED,VEG,PES],["milk"],(380,18,55,10,8),
  [("Rolled oats",0.5,"cup",G),("Greek yogurt",0.5,"cup",D),("Milk",0.5,"cup",D),("Berries",0.5,"cup",P),("Chia seeds",1,"tbsp",PA)],
  ["Stir oats, yogurt, milk and chia in a jar.","Cover and chill overnight.","Top with berries in the morning."],"Use a plant milk and soy yogurt for dairy-free.")
r("veggie-scramble","Vegetable scramble on toast",["breakfast"],12,False,[VEG,PES,MED],["egg","wheat"],(360,21,26,18,5),
  [("Eggs",2,"",D),("Spinach",1,"cup",P),("Bell pepper",0.5,"",P),("Whole wheat bread",1,"slice",G),("Olive oil",1,"tsp",PA)],
  ["Chop the pepper and warm the oil in a pan.","Cook the pepper for 2 minutes, add spinach until it wilts.","Pour in beaten eggs and stir gently until just set.","Serve on toast."])
r("yogurt-parfait","Yogurt parfait",["breakfast","snack"],5,False,[VEG,PES,MED],["milk","treeNut"],(320,22,34,11,5),
  [("Greek yogurt",1,"cup",D),("Berries",0.5,"cup",P),("Almonds",1,"tbsp",PA),("Honey",1,"tsp",PA)],
  ["Spoon yogurt into a bowl or glass.","Layer berries and chopped almonds on top.","Drizzle with honey."])
r("banana-pb-toast","Banana peanut butter toast",["breakfast","snack"],5,False,[VEG,PES],["peanut","wheat"],(330,11,45,12,7),
  [("Whole wheat bread",2,"slice",G),("Peanut butter",1,"tbsp",PA),("Banana",1,"",P)],
  ["Toast the bread.","Spread peanut butter.","Slice the banana on top."],"Use sunflower seed butter for a peanut-free version.")
r("steak-and-eggs","Steak and eggs",["breakfast","dinner"],15,False,[CAR],["egg"],(560,52,0,38,0),
  [("Steak",150,"g",M),("Eggs",2,"",D),("Butter",1,"tsp",D)],
  ["Pat the steak dry and season with salt.","Cook in a hot pan 3 to 4 minutes per side, then rest.","Fry the eggs in butter and serve together."])
r("smoked-salmon-bagel","Smoked salmon bagel",["breakfast"],5,False,[PES,MED],["fish","wheat","milk"],(420,24,48,14,2),
  [("Bagel",1,"",G),("Smoked salmon",60,"g",M),("Cream cheese",1,"tbsp",D),("Cucumber",0.25,"",P)],
  ["Toast the bagel.","Spread cream cheese.","Top with salmon and cucumber slices."])
r("tofu-scramble","Tofu scramble",["breakfast","lunch"],15,False,[VEG,MED],["soy"],(310,22,14,18,5),
  [("Tofu",200,"g",D),("Spinach",1,"cup",P),("Tomato",1,"",P),("Turmeric",0.5,"tsp",PA),("Olive oil",1,"tsp",PA)],
  ["Crumble the tofu with your hands.","Warm oil, add tofu and turmeric, cook 5 minutes.","Add chopped tomato and spinach until warm."])
r("bacon-egg-cups","Bacon and egg cups",["breakfast","snack"],20,True,[CAR],["egg"],(290,20,1,22,0),
  [("Bacon",2,"slice",M),("Eggs",2,"",D)],
  ["Heat oven to 190°C / 375°F.","Line two muffin cups with bacon.","Crack an egg into each and bake 12 to 15 minutes."])
# lunches
r("chicken-grain-bowl","Chicken grain bowl",["lunch","dinner"],25,False,[MED],[],(540,42,55,16,8),
  [("Chicken breast",120,"g",M),("Quinoa",0.75,"cup",G),("Cucumber",0.5,"",P),("Tomato",1,"",P),("Olive oil",1,"tbsp",PA),("Lemon",0.5,"",P)],
  ["Cook quinoa as the packet says.","Season and pan-cook the chicken 6 minutes per side until cooked through.","Chop cucumber and tomato.","Slice chicken and build the bowl; dress with oil and lemon."])
r("lentil-soup","Red lentil soup",["lunch","dinner"],30,False,[VEG,MED,PES],[],(380,20,58,7,15),
  [("Red lentils",0.75,"cup",PA),("Carrot",1,"",P),("Onion",1,"",P),("Vegetable stock",3,"cup",PA),("Olive oil",1,"tsp",PA)],
  ["Chop onion and carrot; soften in oil for 5 minutes.","Add rinsed lentils and stock.","Simmer 20 minutes until soft, then blend if you like."],"Freeze extra portions for busy days.")
r("tuna-salad-wrap","Tuna salad wrap",["lunch"],10,False,[PES],["fish","wheat","egg"],(430,32,38,15,5),
  [("Tuna, canned",1,"can",PA),("Tortilla",1,"",G),("Mayonnaise",1,"tbsp",PA),("Lettuce",1,"cup",P),("Tomato",0.5,"",P)],
  ["Mix tuna with mayonnaise.","Lay lettuce and tomato on the tortilla.","Add tuna, roll tightly and slice."])
r("chickpea-salad","Mediterranean chickpea salad",["lunch"],10,False,[VEG,MED,PES],["milk"],(450,18,48,20,13),
  [("Chickpeas, canned",1,"cup",PA),("Cucumber",0.5,"",P),("Tomato",1,"",P),("Feta",30,"g",D),("Olive oil",1,"tbsp",PA),("Lemon",0.5,"",P)],
  ["Rinse and drain chickpeas.","Chop vegetables and crumble feta.","Toss everything with oil, lemon and a pinch of salt."])
r("burger-lettuce-wrap","Burger lettuce wraps",["lunch","dinner"],15,False,[CAR],[],(480,38,2,35,0),
  [("Ground beef",150,"g",M),("Salt",1,"pinch",PA)],
  ["Shape beef into two patties and season.","Cook 4 minutes per side.","Serve as they are, or wrapped in lettuce if you eat plants."])
r("hummus-veggie-sandwich","Hummus veggie sandwich",["lunch"],8,False,[VEG,MED],["wheat","sesame"],(390,15,52,14,11),
  [("Whole wheat bread",2,"slice",G),("Hummus",0.25,"cup",PA),("Carrot",1,"",P),("Spinach",1,"cup",P),("Cucumber",0.25,"",P)],
  ["Spread hummus on both slices.","Add grated carrot, spinach and cucumber.","Close, press and cut in half."])
r("salmon-rice-bowl","Salmon rice bowl",["lunch","dinner"],20,False,[PES,MED],["fish","soy","sesame"],(560,34,58,20,4),
  [("Salmon",120,"g",M),("White rice",0.75,"cup",G),("Cucumber",0.5,"",P),("Soy sauce",1,"tbsp",PA),("Sesame seeds",1,"tsp",PA)],
  ["Cook rice.","Pan-cook salmon skin-side down 5 minutes, flip for 3.","Flake salmon over rice with cucumber, soy and sesame."])
r("egg-fried-rice","Vegetable egg fried rice",["lunch","dinner"],15,False,[VEG,PES],["egg","soy"],(480,18,66,15,5),
  [("Cooked rice",1.5,"cup",G),("Eggs",2,"",D),("Mixed vegetables",1,"cup",F),("Soy sauce",1,"tbsp",PA),("Oil",1,"tsp",PA)],
  ["Heat oil in a large pan.","Scramble eggs and set aside.","Fry vegetables and rice 4 minutes.","Return eggs, add soy sauce and toss."],"Day-old rice works best.")
# dinners
r("sheet-pan-chicken","Sheet-pan chicken and vegetables",["dinner"],35,True,[MED],[],(520,40,40,20,8),
  [("Chicken breast",130,"g",M),("Sweet potato",1,"",P),("Broccoli",1,"cup",P),("Olive oil",1,"tbsp",PA)],
  ["Heat oven to 200°C / 400°F.","Cut sweet potato into cubes; toss with broccoli and oil.","Add chicken on the tray and season.","Roast 25 minutes until the chicken is cooked through."])
r("baked-salmon","Baked salmon, potatoes and greens",["dinner"],30,True,[PES,MED],["fish"],(560,36,40,24,6),
  [("Salmon",125,"g",M),("Potato",1,"",P),("Green beans",1,"cup",P),("Olive oil",1,"tbsp",PA),("Lemon",0.5,"",P)],
  ["Heat oven to 200°C / 400°F.","Roast sliced potato with oil for 15 minutes.","Add salmon and beans, roast 12 more minutes.","Squeeze lemon on top."])
r("beef-stir-fry","Beef and vegetable stir-fry",["dinner"],20,False,[],["soy"],(540,36,52,18,6),
  [("Beef strips",130,"g",M),("Mixed vegetables",1.5,"cup",F),("White rice",0.75,"cup",G),("Soy sauce",1,"tbsp",PA),("Oil",1,"tsp",PA)],
  ["Cook rice.","Stir-fry beef in hot oil 3 minutes; remove.","Stir-fry vegetables 4 minutes.","Return beef, add soy sauce, serve over rice."])
r("bean-chili","Three-bean chili",["dinner","lunch"],35,False,[VEG,MED,PES],[],(450,22,70,8,22),
  [("Black beans, canned",1,"cup",PA),("Kidney beans, canned",0.5,"cup",PA),("Chopped tomatoes",1,"can",PA),("Onion",1,"",P),("Chili spices",1,"tbsp",PA)],
  ["Soften chopped onion in a pot.","Add spices, tomatoes and drained beans.","Simmer 25 minutes, stirring now and then."],"Top with yogurt or avocado if you like.")
r("pasta-primavera","Pasta with vegetables",["dinner"],20,False,[VEG,MED,PES],["wheat","milk"],(520,19,78,15,8),
  [("Pasta",85,"g",G),("Zucchini",1,"",P),("Cherry tomatoes",1,"cup",P),("Parmesan",15,"g",D),("Olive oil",1,"tbsp",PA)],
  ["Boil pasta as the packet says.","Pan-cook sliced zucchini and tomatoes in oil 6 minutes.","Toss with pasta and parmesan."])
r("shrimp-tacos","Shrimp tacos",["dinner"],20,False,[PES],["shellfish","wheat"],(470,30,50,16,7),
  [("Shrimp",150,"g",M),("Tortilla",2,"",G),("Cabbage",1,"cup",P),("Lime",1,"",P),("Avocado",0.5,"",P)],
  ["Cook shrimp in a hot pan 2 minutes per side.","Warm tortillas.","Fill with cabbage, shrimp and avocado; squeeze lime."])
r("roast-chicken-thighs","Crispy chicken thighs",["dinner","lunch"],40,True,[CAR],[],(450,38,0,32,0),
  [("Chicken thighs",2,"",M),("Salt",1,"pinch",PA)],
  ["Heat oven to 210°C / 410°F.","Salt the thighs and place skin-up on a tray.","Roast 35 minutes until golden and cooked through."])
r("dal-rice","Dal with rice",["dinner","lunch"],30,False,[VEG,PES],["milk"],(520,22,88,8,14),
  [("Red lentils",0.75,"cup",PA),("White rice",0.75,"cup",G),("Onion",1,"",P),("Curry spices",1,"tbsp",PA),("Butter",1,"tsp",D)],
  ["Simmer rinsed lentils in water 20 minutes.","Fry onion and spices in butter, stir into lentils.","Serve with rice."])
r("pork-chop-dinner","Pork chop with apples and greens",["dinner"],25,False,[],[],(500,38,30,24,6),
  [("Pork chop",1,"",M),("Apple",1,"",P),("Spinach",2,"cup",P),("Oil",1,"tsp",PA)],
  ["Cook the chop 4 to 5 minutes per side.","Soften sliced apple in the same pan.","Wilt spinach and serve together."])
r("fish-stew","Tomato fish stew",["dinner"],25,False,[PES,MED],["fish"],(420,34,30,16,6),
  [("White fish",150,"g",M),("Chopped tomatoes",1,"can",PA),("Potato",1,"",P),("Onion",1,"",P),("Olive oil",1,"tbsp",PA)],
  ["Soften onion in oil.","Add tomatoes and diced potato; simmer 12 minutes.","Add fish chunks and simmer 6 minutes until flaky."])
# snacks
r("apple-pb","Apple and peanut butter",["snack"],2,False,[VEG,PES],["peanut"],(190,4,26,8,5),
  [("Apple",1,"",P),("Peanut butter",1,"tbsp",PA)],["Slice the apple.","Dip in peanut butter."])
r("hummus-carrots","Hummus and carrots",["snack"],3,False,[VEG,MED,PES],["sesame"],(160,5,18,7,6),
  [("Hummus",0.25,"cup",PA),("Carrot",2,"",P)],["Cut carrots into sticks.","Serve with hummus."])
r("boiled-eggs","Two boiled eggs",["snack","breakfast"],12,False,[CAR,VEG,PES,MED],["egg"],(144,13,1,10,0),
  [("Eggs",2,"",D)],["Boil eggs for 9 minutes.","Cool in cold water and peel."])
r("beef-jerky","Beef jerky",["snack"],1,False,[CAR],[],(160,26,6,3,0),
  [("Beef jerky",50,"g",M)],["Open and enjoy. Check the label for added sugar."])
r("trail-mix","Nut and fruit mix",["snack"],2,False,[VEG,MED,PES],["treeNut"],(200,6,18,13,3),
  [("Almonds",1,"handful",PA),("Raisins",1,"tbsp",PA)],["Mix in a small container."])
r("cottage-cheese-fruit","Cottage cheese and fruit",["snack","breakfast"],3,False,[VEG,PES,MED],["milk"],(180,15,20,5,2),
  [("Cottage cheese",0.5,"cup",D),("Berries",0.5,"cup",P)],["Spoon cottage cheese into a bowl.","Top with fruit."])
assert len(R) == 32, len(R)
path = pathlib.Path(__file__).resolve().parents[2]/"NutraCore/Sources/NutraCore/Resources/recipes.json"
path.write_text(json.dumps(R, indent=1, ensure_ascii=False)+"\n"); print("wrote", len(R), "recipes")
from collections import Counter
for d in ["", MED, CAR, PES, VEG]:
    print(d or "none", Counter(s for x in R if not d or d in x["diets"] for s in x["slots"]))
