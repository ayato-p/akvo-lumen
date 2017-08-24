(ns akvo.lumen.lib.pie-test
  (:require [akvo.lumen.fixtures :refer [migrate-tenant rollback-tenant]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.test-utils
             :refer
             [import-file-2 test-tenant test-tenant-conn]]
            [clojure.test :refer :all]))

;; (def test-system
;;   (->
;;    (component/system-map
;;     :tenant-manager (tenant-manager {})
;;     :db (hikaricp {:uri (:db_uri test-tenant-spec)}))
;;    (component/system-using
;;     {:tenant-manager [:db]})))

;; (def ^:dynamic *tenant-conn*)
;; (def ^:dynamic *dataset-id*)



;; (defn fixture [f]
;;   (migrate-tenant test-tenant-spec)
;;   (alter-var-root #'test-system component/start)
;;   (binding [*tenant-conn* (:spec (:db test-system))
;;             *dataset-id* (import-file-2 *tenant-conn* "pie.csv" {:dataset-name "pie"
;;                                                                  :has-column-headers? true})]
;;     (f)
;;     (alter-var-root #'test-system component/stop)
;;     (rollback-tenant test-tenant-spec)))

;; (use-fixtures :once fixture)

(def ^:dynamic *tenant-conn*)
(def ^:dynamic *dataset-id*)

(defn fixture [f]
  (migrate-tenant test-tenant)
  (binding [;;*tenant-conn* {:connection-uri (:db_uri test-tenant)}
            *tenant-conn* (test-tenant-conn test-tenant)]
    (f)
    (rollback-tenant test-tenant)))

(use-fixtures :once fixture)

(deftest ^:functional test-pie
  (let [dataset-id (import-file-2 *tenant-conn* "pie.csv" {:dataset-name "pie"
                                                           :has-column-headers? true})
        query (partial aggregation/query *tenant-conn* dataset-id "pie")]
    (testing "Simple queries"
      (let [[tag query-result] (query {"bucketColumn" "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {"metadata" {"bucketColumnTitle" "A"
                                         "bucketColumnType" "text"},
                             "data" [{"bucketValue" "a1", "bucketCount" 4}
                                     {"bucketValue" "a2", "bucketCount" 4}]})))

      (let [[tag query-result] (query {"bucketColumn" "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result {"metadata" {"bucketColumnTitle" "B"
                                         "bucketColumnType" "text"},
                             "data" [{"bucketValue" "b1", "bucketCount" 5}
                                     {"bucketValue" "b2", "bucketCount" 3}]}))))))
