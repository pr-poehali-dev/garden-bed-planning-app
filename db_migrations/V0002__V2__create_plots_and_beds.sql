
CREATE TABLE t_p8600735_garden_bed_planning_.plots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p8600735_garden_bed_planning_.beds (
  id TEXT PRIMARY KEY,
  plot_id TEXT NOT NULL REFERENCES t_p8600735_garden_bed_planning_.plots(id),
  name TEXT NOT NULL,
  x FLOAT NOT NULL DEFAULT 5,
  y FLOAT NOT NULL DEFAULT 10,
  w FLOAT NOT NULL DEFAULT 22,
  h FLOAT NOT NULL DEFAULT 16,
  cols INT NOT NULL DEFAULT 3,
  rows INT NOT NULL DEFAULT 2,
  color TEXT NOT NULL DEFAULT '#5a7a3a',
  cells JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p8600735_garden_bed_planning_.plots (id, name) VALUES ('plot1', 'Мой огород');

INSERT INTO t_p8600735_garden_bed_planning_.beds (id, plot_id, name, x, y, w, h, cols, rows, color, cells) VALUES
('b1', 'plot1', 'Грядка А', 5, 10, 23, 16, 3, 2, '#8B6914',
 '[{"emoji":"🍅","name":"Томаты","color":"#c0392b"},{"emoji":"🍅","name":"Томаты","color":"#c0392b"},{"emoji":"🥒","name":"Огурцы","color":"#2ecc71"},null,null,null]'),
('b2', 'plot1', 'Грядка Б', 32, 10, 22, 16, 2, 3, '#5a7a3a',
 '[{"emoji":"🥕","name":"Морковь","color":"#e67e22"},{"emoji":"🥬","name":"Салат","color":"#27ae60"},null,null,null,null]'),
('b3', 'plot1', 'Грядка В', 5, 40, 30, 10, 4, 1, '#7a4a2a',
 '[{"emoji":"🌿","name":"Зелень","color":"#45b39d"},{"emoji":"🌿","name":"Зелень","color":"#45b39d"},null,null]'),
('b4', 'plot1', 'Грядка Г', 40, 40, 22, 16, 2, 2, '#3a6b5a',
 '[null,null,null,null]');
