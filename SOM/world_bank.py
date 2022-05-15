import csv


class world_bank_data:
    def __init__(self, file_name, year):
        self.file_name = file_name
        self.data = self.read_data(year)

    def read_data(self, year):
        '''
        Reads the data from the world bank csv file
        '''
        data = {}
        year_index = 0
        with open(self.file_name, mode='r') as csv_file:
            csv_reader = csv.reader(csv_file)
            line_count = 0
            for row in csv_reader:

                if line_count == 4:

                    for i in row:
                        if i == year:
                            year_index = row.index(i)

                elif line_count > 4:
                    if row[year_index] != '':
                        if row[0] in data.keys():
                            data[row[0]].append(float(row[year_index]))
                        else:
                            data[row[0]] = [float(row[year_index])]
                    else:
                        if row[0] in data.keys():
                            data[row[0]].append(0)
                        else:
                            data[row[0]] = [0]
                line_count += 1

        # Normalize the data
        max = [0 for i in range(len(list(data.values())[0]))]
        min = [float('inf') for i in range(len(list(data.values())[0]))]

        for j in range(len(list(data.values())[0])):
            for i in data.keys():

                if data[i][j] != '':

                    if float(data[i][j]) < min[j] and float(data[i][j]) >= 0:
                        min[j] = float(data[i][j])

                    if float(data[i][j]) > max[j]:
                        max[j] = float(data[i][j])

        for i in range(len(min)):
            if min[i] == float('inf'):
                min[i] = 0

        for j in range(len(list(data.values())[0])):
            for i in data.keys():
                try:
                    data[i][j] = (data[i][j] - min[j]) / (max[j] - min[j])
                except ZeroDivisionError:
                    if data[i][j] > 1:
                        data[i][j] = 1
                    if data[i][j] < 0:
                        data[i][j] = 0

        return data
