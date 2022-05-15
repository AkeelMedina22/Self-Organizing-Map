import numpy as np
from sklearn.decomposition import TruncatedSVD


class som:
    def __init__(self, input_shape, output_shape, learning_rate):

        self.network_shape = [input_shape, output_shape]
        self.learning_rate = learning_rate
        self.map_radius = output_shape / 2
        self.weight_array = self.generate_network()

    def generate_network(self):
        '''
        Given a shape of the network, generate randomized weight matrices for the network
        '''
        return np.random.rand(self.network_shape[1] * self.network_shape[1],
                              self.network_shape[0])

    def run_network(self, current_input):
        '''
        Given a trained network and the input(s), predict the possible output
        '''
        #Rows in the weight matrix correspond to nodes of the next layer
        #whereas columns correspond to nodes of the previous layer
        #print network_weights

        final_index, index = self.get_BMU(current_input)

        time = 1
        iterations = 4

        while time < iterations:

            count = 0
            neighbourhood_radius = self.exp_decrease(time, iterations)

            for x in range(len(self.weight_array)):

                temp = np.array(
                    (x // self.network_shape[1], x % self.network_shape[1]))
                d = np.sqrt((temp[0] - final_index[0])**2 +
                            (temp[1] - final_index[1])**2)
                in_circle = d < neighbourhood_radius

                if in_circle:

                    learning = self.learning_rate * np.exp(-time / iterations)
                    theta = np.exp(-((d)**2 / (2 * (neighbourhood_radius**2))))
                    self.weight_array[count] += learning + theta * (
                        np.array(current_input) - self.weight_array[count])

                count += 1
            time += 1

    def get_BMU(self, current_input):

        most_similar = float('inf')
        index = 0
        final = 0
        final_index = 0

        for network_weight in self.weight_array:

            current_output = np.linalg.norm(current_input - network_weight)

            if current_output < most_similar:
                most_similar = current_output
                final = index
                final_index = np.array((index // self.network_shape[1],
                                        index % self.network_shape[1]))

            index += 1

        return final_index, final

    def exp_decrease(self, time, iterations):

        time_constant = iterations / np.log(self.map_radius)
        neighbourhood_radius = self.map_radius * np.exp(-time / time_constant)
        return neighbourhood_radius
