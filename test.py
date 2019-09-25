import pandas as pd
from pandas.plotting import scatter_matrix
import numpy as np
import matplotlib.pyplot as plt

df = pd.read_json('players.json', orient = 'columns');

print(df.iloc[0, [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12]])

scatter_matrix(df.iloc[:, [0, 2, 10, 11, 12]], alpha=0.2, figsize = (6, 6), diagonal = 'kde')


plt.show()
