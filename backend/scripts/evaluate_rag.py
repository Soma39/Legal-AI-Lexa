import os
import sys
import json
import logging

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.rag.vector_store import vector_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def evaluate_retrieval_benchmark():
    benchmark_file = os.path.join(backend_dir, "data", "sample_eval", "evaluation_benchmark.json")
    with open(benchmark_file, "r", encoding="utf-8") as f:
        cases = json.load(f)

    total_queries = len(cases)
    hit_at_1 = 0
    hit_at_3 = 0
    reciprocal_ranks = []

    print("\n========================================================")
    print("      LegalAI Retrieval-Augmented Evaluation Benchmark")
    print("========================================================\n")

    for c in cases:
        query = c["query"]
        expected_statute = c["expected_statute"].lower()
        expected_section = c["expected_section"].lower()

        # Run vector retrieval
        results = vector_store.search(query=query, top_k=5, min_score=0.01)

        found_rank = None
        for rank, item in enumerate(results, start=1):
            statute_match = expected_statute in item.get("statute", "").lower() or expected_statute in item.get("title", "").lower()
            section_match = any(s.strip() in item.get("section", "").lower() for s in expected_section.split(","))

            if statute_match and section_match:
                found_rank = rank
                break

        if found_rank == 1:
            hit_at_1 += 1
            hit_at_3 += 1
            reciprocal_ranks.append(1.0)
            status = "HIT @ 1"
        elif found_rank is not None and found_rank <= 3:
            hit_at_3 += 1
            reciprocal_ranks.append(1.0 / found_rank)
            status = f"HIT @ {found_rank}"
        elif found_rank is not None:
            reciprocal_ranks.append(1.0 / found_rank)
            status = f"HIT @ {found_rank}"
        else:
            reciprocal_ranks.append(0.0)
            status = "MISS"

        print(f"[{c['id']}] {status} | Query: {query[:55]}...")
        if found_rank:
            print(f"       -> Retrieved: {results[found_rank-1]['statute']} ({results[found_rank-1]['section']})")
        else:
            print(f"       -> Expected: {c['expected_statute']} ({c['expected_section']})")

    hit_1_rate = (hit_at_1 / total_queries) * 100
    hit_3_rate = (hit_at_3 / total_queries) * 100
    mrr = sum(reciprocal_ranks) / total_queries

    print("\n--------------------------------------------------------")
    print(f"Total Evaluated Benchmark Queries : {total_queries}")
    print(f"Hit@1 Rate                        : {hit_1_rate:.1f}%")
    print(f"Hit@3 Rate                        : {hit_3_rate:.1f}%")
    print(f"Mean Reciprocal Rank (MRR)        : {mrr:.3f}")
    print("--------------------------------------------------------\n")

    return {
        "hit_at_1_pct": hit_1_rate,
        "hit_at_3_pct": hit_3_rate,
        "mrr": mrr
    }


if __name__ == "__main__":
    evaluate_retrieval_benchmark()
