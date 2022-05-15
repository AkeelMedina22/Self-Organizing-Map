from wall import *
from som import *
from world_bank import *
import random


def main():

    iterations = 500
    w = world_bank_data('education.csv', '2018')
    som_network = som(len(list(w.data.values())[0]), GRID_H, 1 / iterations)

    for i in range(iterations):
        country = random.choice(list(w.data.keys()))
        som_network.run_network(w.data[country])

    # _, most = som_network.get_BMU(w.data['United States'])
    # __, least = som_network.get_BMU(w.data['Pakistan'])

    svd = TruncatedSVD(n_components=3)
    A_transf = svd.fit_transform(som_network.weight_array)

    # A_transf[most] = [-10,-10,-10]
    # A_transf[least] = [-10,-10,-10]

    root = tkinter.Tk(className="Color Wall")
    k = Wall(A_transf, root, width=WIDTH * GRID_W, height=HEIGHT * GRID_H)
    k.pack(expand=True, fill="both")
    root.mainloop()
    return


if __name__ == "__main__":
    main()
