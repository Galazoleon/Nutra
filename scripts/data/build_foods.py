"""Builds NutraCore/Sources/NutraCore/Resources/foods.json.
Values are per ONE portion and are rough ESTIMATES, not USDA-verified.
Micros order: vitaminA(mcg) vitaminC(mg) vitaminD(mcg) vitaminB12(mcg) folate(mcg)
              calcium(mg) iron(mg) magnesium(mg) potassium(mg) zinc(mg)
Run: python3 scripts/data/build_foods.py
"""
import json, pathlib

M = ["vitaminA","vitaminC","vitaminD","vitaminB12","folate","calcium","iron","magnesium","potassium","zinc"]
# id, name, aliases, portion, grams, group, kcal, protein, carbs, fat, fiber, gi, allergens, fried, micros
F = [
("egg","Egg",["eggs","boiled egg","fried egg","scrambled eggs"],"egg",50,"protein",72,6.3,0.4,4.8,0,None,["egg"],False,[80,0,1.1,0.45,24,28,0.9,6,69,0.6]),
("chicken-breast","Chicken breast",["chicken","grilled chicken"],"palm-size piece",120,"protein",198,37,0,4.3,0,None,[],False,[11,0,0.1,0.4,5,18,1.2,35,307,1.2]),
("salmon","Salmon",["salmon fillet"],"fillet",125,"protein",260,27,0,16,0,None,["fish"],False,[59,0,13,3.5,31,15,0.4,36,490,0.5]),
("tuna","Tuna, canned",["tuna","canned tuna"],"small can",100,"protein",116,26,0,1,0,None,["fish"],False,[17,0,1.7,2.5,4,11,1.3,27,237,0.7]),
("shrimp","Shrimp",["prawns","prawn","shrimps"],"portion",100,"protein",99,24,0.2,0.3,0,None,["shellfish"],False,[54,0,0,1.1,19,70,0.5,39,259,1.6]),
("beef-mince","Ground beef",["beef","mince","ground beef","burger patty"],"portion",100,"protein",250,26,0,17,0,None,[],False,[0,0,0.1,2.6,9,18,2.6,21,318,6.3]),
("steak","Steak",["beef steak"],"steak",150,"protein",310,40,0,16,0,None,[],False,[0,0,0.2,3.0,10,24,3.0,33,480,8.0]),
("pork-chop","Pork chop",["pork"],"chop",130,"protein",270,36,0,13,0,None,[],False,[3,0.7,0.8,0.8,1,25,1.0,33,480,2.9]),
("tofu","Tofu",["bean curd"],"block slice",120,"protein",173,18,4.2,10,2.8,15,["soy"],False,[0,0,0,0,23,420,3.2,70,190,1.9]),
("lentils","Lentils, cooked",["lentil","dal","dhal"],"cup",200,"protein",230,18,40,0.8,15.6,32,[],False,[2,3,0,0,358,38,6.6,71,731,2.5]),
("chickpeas","Chickpeas, cooked",["chickpea","garbanzo"],"cup",165,"protein",269,14.5,45,4.2,12.5,28,[],False,[2,2,0,0,282,80,4.7,79,477,2.5]),
("black-beans","Black beans, cooked",["beans","black bean"],"cup",172,"protein",227,15,41,0.9,15,30,[],False,[0,0,0,0,256,46,3.6,120,611,1.9]),
("greek-yogurt","Greek yogurt",["yogurt","yoghurt","greek yoghurt"],"cup",200,"dairy",146,20,8,4,0,11,["milk"],False,[40,1,0,1.5,14,230,0.1,22,280,1.0]),
("milk","Milk",["glass of milk"],"cup",244,"dairy",122,8,12,4.8,0,37,["milk"],False,[149,0,2.9,1.3,12,293,0.1,27,342,1.0]),
("cheddar","Cheese",["cheddar","cheese slice"],"slice",28,"dairy",113,7,0.4,9.3,0,None,["milk"],False,[75,0,0.2,0.3,5,200,0.2,8,21,1.0]),
("cottage-cheese","Cottage cheese",[],"half cup",113,"dairy",110,12.5,4,5,0,10,["milk"],False,[40,0,0.1,0.5,14,94,0.1,9,117,0.5]),
("oats","Oatmeal",["oats","porridge","oatmeal"],"cup cooked",234,"grain",166,6,28,3.6,4,55,[],False,[0,0,0,0,14,21,2.1,63,164,2.3]),
("white-rice","White rice",["rice","steamed rice"],"cup",158,"grain",205,4.3,45,0.4,0.6,73,[],False,[0,0,0,0,92,16,1.9,19,55,0.8]),
("brown-rice","Brown rice",[],"cup",195,"grain",216,5,45,1.8,3.5,68,[],False,[0,0,0,0,8,20,0.8,84,154,1.2]),
("pasta","Pasta",["spaghetti","noodles","penne","macaroni"],"cup",140,"grain",220,8,43,1.3,2.5,49,["wheat"],False,[0,0,0,0,102,10,1.8,25,62,0.7]),
("bread","Bread",["toast","slice of bread","white bread"],"slice",30,"grain",80,2.7,15,1,0.8,75,["wheat"],False,[0,0,0,0,30,40,1.0,7,35,0.2]),
("whole-wheat-bread","Whole wheat bread",["wholemeal bread","brown bread","whole grain toast"],"slice",32,"grain",81,4,14,1.1,1.9,69,["wheat"],False,[0,0,0,0,14,52,0.8,24,81,0.6]),
("tortilla","Tortilla",["wrap","flour tortilla"],"tortilla",45,"grain",140,3.7,23,3.6,1.4,30,["wheat"],False,[0,0,0,0,40,60,1.5,10,60,0.3]),
("quinoa","Quinoa",[],"cup",185,"grain",222,8,39,3.6,5.2,53,[],False,[2,0,0,0,78,31,2.8,118,318,2.0]),
("potato","Potato",["potatoes","baked potato","boiled potato"],"medium",173,"vegetable",161,4.3,37,0.2,3.8,78,[],False,[2,17,0,0,48,26,1.9,48,926,0.6]),
("sweet-potato","Sweet potato",["sweet potatoes","yam"],"medium",130,"vegetable",112,2,26,0.1,3.9,63,[],False,[922,3,0,0,14,39,0.8,32,438,0.4]),
("fries","French fries",["fries","chips","french fries"],"medium serving",117,"grain",365,4,48,17,4.4,75,[],True,[0,5,0,0,30,20,0.9,40,680,0.5]),
("broccoli","Broccoli",[],"cup",91,"vegetable",31,2.5,6,0.3,2.4,15,[],False,[28,81,0,0,57,43,0.7,19,288,0.4]),
("spinach","Spinach",["greens"],"cup raw",30,"vegetable",7,0.9,1.1,0.1,0.7,15,[],False,[141,8,0,0,58,30,0.8,24,167,0.2]),
("salad","Green salad",["salad","lettuce","mixed greens"],"bowl",100,"vegetable",20,1.4,3.5,0.2,1.8,15,[],False,[200,15,0,0,60,35,0.9,13,250,0.2]),
("carrot","Carrot",["carrots"],"medium",61,"vegetable",25,0.6,6,0.1,1.7,39,[],False,[509,4,0,0,12,20,0.2,7,195,0.1]),
("tomato","Tomato",["tomatoes"],"medium",123,"vegetable",22,1.1,4.8,0.2,1.5,15,[],False,[52,17,0,0,18,12,0.3,14,292,0.2]),
("cucumber","Cucumber",[],"half",150,"vegetable",23,1,5.4,0.2,0.8,15,[],False,[8,4,0,0,10,24,0.4,20,220,0.3]),
("bell-pepper","Bell pepper",["pepper","peppers","capsicum"],"medium",119,"vegetable",31,1,7,0.4,2.1,15,[],False,[187,152,0,0,55,8,0.5,14,251,0.3]),
("mixed-veg","Mixed vegetables",["vegetables","veggies","stir fry vegetables"],"cup",150,"vegetable",65,3,13,0.3,4,40,[],False,[300,10,0,0,40,40,1.0,30,300,0.6]),
("avocado","Avocado",["avocados","guacamole"],"half",100,"fat",160,2,8.5,14.7,6.7,15,[],False,[7,10,0,0,81,12,0.6,29,485,0.6]),
("banana","Banana",["bananas"],"medium",118,"fruit",105,1.3,27,0.4,3.1,51,[],False,[4,10,0,0,24,6,0.3,32,422,0.2]),
("apple","Apple",["apples"],"medium",182,"fruit",95,0.5,25,0.3,4.4,36,[],False,[5,8,0,0,5,11,0.2,9,195,0.1]),
("orange","Orange",["oranges"],"medium",131,"fruit",62,1.2,15.4,0.2,3.1,43,[],False,[14,70,0,0,40,52,0.1,13,237,0.1]),
("berries","Berries",["blueberries","strawberries","raspberries","berry"],"cup",148,"fruit",70,1,17,0.5,3.5,40,[],False,[3,40,0,0,20,15,0.4,12,150,0.2]),
("grapes","Grapes",[],"cup",151,"fruit",104,1.1,27,0.2,1.4,59,[],False,[5,5,0,0,3,15,0.5,11,288,0.1]),
("mango","Mango",["mangoes"],"cup",165,"fruit",99,1.4,25,0.6,2.6,51,[],False,[89,60,0,0,71,18,0.3,17,277,0.1]),
("almonds","Almonds",["nuts","almond"],"handful",28,"fat",164,6,6,14,3.5,None,["treeNut"],False,[0,0,0,0,14,76,1.0,76,208,0.9]),
("peanut-butter","Peanut butter",["pb"],"tablespoon",16,"fat",95,3.5,3.5,8,0.8,14,["peanut"],False,[0,0,0,0,12,7,0.3,26,90,0.4]),
("olive-oil","Olive oil",["oil"],"tablespoon",14,"fat",119,0,0,13.5,0,None,[],False,[0,0,0,0,0,0,0.1,0,0,0]),
("butter","Butter",[],"teaspoon",5,"fat",36,0,0,4.1,0,None,["milk"],False,[34,0,0,0,0,1,0,0,1,0]),
("hummus","Hummus",[],"quarter cup",62,"protein",102,4.9,8.8,5.9,3.7,6,["sesame"],False,[1,0,0,0,51,24,1.5,44,140,1.1]),
("coffee","Coffee",["black coffee","espresso","americano"],"cup",240,"drink",2,0.3,0,0,0,None,[],False,[0,0,0,0,5,5,0,7,116,0]),
("latte","Latte",["cappuccino","flat white"],"medium",350,"drink",190,12,18,7,0,30,["milk"],False,[120,0,2.5,1.2,15,400,0.2,40,520,1.4]),
("orange-juice","Orange juice",["juice","oj"],"cup",248,"drink",112,1.7,26,0.5,0.5,50,[],False,[25,124,0,0,74,27,0.5,27,496,0.1]),
("soda","Soda",["cola","soft drink","coke","pop"],"can",355,"drink",140,0,39,0,0,63,[],False,[0,0,0,0,0,7,0.1,0,4,0]),
("pizza","Pizza",["pizza slice","slice of pizza"],"slice",107,"mixed",285,12,36,10,2.5,60,["wheat","milk"],False,[70,1,0.2,0.4,40,200,2.6,24,180,1.6]),
("burger","Burger",["hamburger","cheeseburger"],"burger",220,"mixed",540,30,40,28,2,66,["wheat","milk"],False,[60,2,0.3,2.4,60,170,4.5,40,450,5.5]),
("fried-chicken","Fried chicken",["chicken nuggets","nuggets","chicken wings"],"piece",120,"protein",320,25,11,19,0.5,None,["wheat"],True,[20,0,0.2,0.4,10,20,1.2,25,250,1.7]),
("sushi","Sushi roll",["sushi","maki"],"roll (6 pieces)",160,"mixed",250,9,38,7,2,55,["fish","soy","sesame"],False,[50,2,1.5,0.8,25,20,0.8,20,180,0.8]),
("dark-chocolate","Dark chocolate",["chocolate"],"square block",20,"sweet",120,1.6,9,8.5,2.2,23,["milk"],False,[0,0,0,0,2,15,2.4,46,143,0.7]),
("ice-cream","Ice cream",[],"half cup",66,"sweet",137,2.3,16,7.3,0.5,51,["milk"],False,[78,0,0.1,0.3,3,84,0.1,9,131,0.5]),
("granola-bar","Granola bar",["cereal bar","protein bar"],"bar",40,"sweet",180,4,27,6.5,2,61,["wheat","treeNut"],False,[0,0,0,0,10,20,1.0,30,120,0.6]),
]
assert len(F) == 58, len(F)
out = []
for (i,n,a,p,g,grp,k,pr,c,f,fi,gi,al,fr,mic) in F:
    rec = {"id":i,"name":n,"aliases":a,"portion":p,"grams":g,"group":grp,"kcal":k,"protein":pr,
           "carbs":c,"fat":f,"fiber":fi,"gi":gi,
           "micros":{m:v for m,v in zip(M,mic) if v},"allergens":al}
    if fr: rec["fried"]=True
    if gi is None: del rec["gi"]
    out.append(rec)
path = pathlib.Path(__file__).resolve().parents[2]/"NutraCore/Sources/NutraCore/Resources/foods.json"
path.write_text(json.dumps(out, indent=1, ensure_ascii=False)+"\n")
print("wrote", len(out), "foods to", path)
