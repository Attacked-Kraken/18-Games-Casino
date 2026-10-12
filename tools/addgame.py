import json,sys
gid,title,tag,ac,cat,mp=sys.argv[1:7]
j=json.load(open('games.json')); j['games']=[g for g in j['games'] if g['id']!=gid]
j['games'].append({"id":gid,"file":gid+".html","title":title,"tagline":tag,"rating":"18+","icon":gid+"-icon.png","accent":ac,"category":cat,"multiplayer":mp=='1',"new":True})
json.dump(j,open('games.json','w'),indent=1)
