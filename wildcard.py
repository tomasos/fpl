import pandas as pd
from pandas.plotting import scatter_matrix
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import linprog

df = pd.read_json('basestats.json', orient = 'columns');





df['keeper'] = df['pos'].map(lambda x: 1 if x == 1 else 0)
df['defender'] = df['pos'].map(lambda x: 1 if x == 2 else 0)
df['midfielder'] = df['pos'].map(lambda x: 1 if x == 3 else 0)
df['forward'] = df['pos'].map(lambda x: 1 if x == 4 else 0)
df['position'] = df['pos'].map(lambda x: ['keeper', 'defender', 'midfielder', 'forward'][x-1])

df['liverpool'] = df['teamid'].map(lambda x: 1 if x == 10 else 0)
df['chelsea'] = df['teamid'].map(lambda x: 1 if x == 6 else 0)

#df.plot(x='ppg', y='price', kind='scatter')
#plt.show()

costs = df['price']
keepers = df['keeper']
defenders = df['defender']
midfielders = df['midfielder']
forwards = df['forward']
team = df['liverpool']
team2 = df['chelsea']
players = np.ones(len(df))

params = np.array([
  costs,
  keepers,
  defenders,
  midfielders,
  forwards,
    players,
    team,
    team2
])

upper_bounds = np.array([
    1000, # max cost
    2,    # max keepers
    5,    # max defenders
    5,    # max midfielders
    3,    # max fowards
    15,    # max players
    3,
    3
])

bounds = [(0, 1) for x in range(len(df))]

# total = df["total"]
# form = df['form']
# xpdiff = df['xPdiff']
# ppgpm = df['ppgpm']
# fpp = df['fpp']
# ppg = df['ppg']
# xpfix = df['xPfix']

check = "total"

df['selected'] = linprog(
  -df[check],
  params,
  upper_bounds,
    bounds=bounds,
).x

print("cost: %.2f" % (df['price'] * df['selected']).sum())
print("keepers: %.2f" % (df['keeper'] * df['selected']).sum())
print("defenders: %.2f" % (df['defender'] * df['selected']).sum())
print("midfielders: %.2f" % (df['midfielder'] * df['selected']).sum())
print("forwards: %.2f" % (df['forward'] * df['selected']).sum())
print("players: %.2f" % (df['selected']).sum())
print("points: %.2f" %  (df['selected'] * df['total']).sum())
print("checking: %s" % check)

print(df.loc[df['selected'] != 0] \
   [['navn', 'team', 'position', 'price', 'total', 'selected']] \
   .sort_values(by=['position'], ascending=False))



