CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT,
    price INT
);

INSERT INTO products (name, price)
VALUES 
('Laptop', 1000),
('Phone', 500)
ON CONFLICT DO NOTHING;