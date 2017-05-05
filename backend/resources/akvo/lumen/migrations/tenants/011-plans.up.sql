CREATE TABLE tier (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     title text NOT NULL UNIQUE CHECK (title IN ('lite','standard','pro','enterprise'))
);

INSERT INTO tier (title) VALUES ('lite');
INSERT INTO tier (title) VALUES ('standard');
INSERT INTO tier (title) VALUES ('pro');
INSERT INTO tier (title) VALUES ('enterprise');
-- ;;

CREATE OR REPLACE FUNCTION standard_tier_id() RETURNS text LANGUAGE SQL AS
$$ SELECT id FROM tier WHERE title = 'standard'; $$;

CREATE TABLE plan (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     tier text REFERENCES tier (id) DEFAULT standard_tier_id(),
     starts timestamptz DEFAULT now(),
     ends timestamptz DEFAULT 'infinity',
     author jsonb
);
-- ;;

CREATE OR REPLACE FUNCTION public.end_plans_fn ()
RETURNS trigger AS
$$
BEGIN
     UPDATE plan SET ends = now() WHERE ends = 'infinity';
     RETURN NULL;
END;
$$
LANGUAGE 'plpgsql';

CREATE TRIGGER end_plans
BEFORE INSERT ON plan
EXECUTE PROCEDURE end_plans_fn();
-- ;;

CREATE TABLE policy (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     title text NOT NULL
);

CREATE TABLE tier_policy (
     id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
     tier text REFERENCES tier (id) NOT NULL,
     policy text REFERENCES policy (id) NOT NULL,
     "statement" jsonb
);

-- ;;

INSERT INTO policy (title) VALUES ('data_update');
INSERT INTO policy (title) VALUES ('max_number_of_visualisations');

-- Lite
INSERT INTO tier_policy (tier, policy, statement)
VALUES (
       (SELECT id FROM tier WHERE title = 'lite'),
       (SELECT id FROM policy WHERE title = 'data_update'),
       '"manual"'::json
);

INSERT INTO tier_policy (tier, policy, statement)
VALUES (
       (SELECT id FROM tier WHERE title = 'lite'),
       (SELECT id FROM policy WHERE title = 'max_number_of_visualisations'),
       '10'::json
);

-- Standard
INSERT INTO tier_policy (tier, policy, statement)
VALUES (
       (SELECT id FROM tier WHERE title = 'standard'),
       (SELECT id FROM policy WHERE title = 'data_update'),
       '"manual"'::json
);

INSERT INTO tier_policy (tier, policy, statement)
VALUES (
       (SELECT id FROM tier WHERE title = 'sta  ndard'),
       (SELECT id FROM policy WHERE title = 'max_number_of_visualisations'),
       '50'::json
);

-- Pro
INSERT INTO tier_policy (tier, policy, statement)
VALUES (
       (SELECT id FROM tier WHERE title = 'pro'),
       (SELECT id FROM policy WHERE title = 'data_update'),
       '"auto"'::json
);

INSERT INTO tier_policy (tier, policy, statement)
VALUES (
       (SELECT id FROM tier WHERE title = 'pro'),
       (SELECT id FROM policy WHERE title = 'max_number_of_visualisations'),
       '200'::json
);
