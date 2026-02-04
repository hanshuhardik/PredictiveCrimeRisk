"""Risk Level Clustering Script
Clusters police stations using KMeans on features:
    FIRs_PER_YEAR, HEINOUS_RATIO, SAFETY_INDEX
Produces an enriched CSV with a RISK_LEVEL categorical label.

Output:
    ps_safety_index_with_risk.csv placed in backend/ directory so backend can auto-load it.

Cluster to label mapping (k=4):
    We order clusters by ascending SAFETY_INDEX mean and map:
        0 -> CRITICAL
        1 -> HIGH
        2 -> MEDIUM
        3 -> LOW

Requirements:
    pandas, numpy, scikit-learn
"""
from __future__ import annotations
import os
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

BASE_FILE = os.path.join(os.path.dirname(__file__), '..', 'backend', 'ps_safety_index.csv')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'backend', 'ps_safety_index_with_risk.csv')
K = 4
RANDOM_STATE = 42


def main():
    if not os.path.exists(BASE_FILE):
        raise FileNotFoundError(f'Base safety file missing: {BASE_FILE}')
    df = pd.read_csv(BASE_FILE)

    # Ensure required feature columns exist
    required = ['FIRs_PER_YEAR', 'HEINOUS_RATIO', 'SAFETY_INDEX']
    for col in required:
        if col not in df.columns:
            raise ValueError(f'Missing required column for clustering: {col}')

    # Prepare feature matrix, fill NA with median
    feat_df = df[required].copy()
    for c in required:
        if feat_df[c].isna().any():
            feat_df[c].fillna(feat_df[c].median(), inplace=True)

    X = feat_df.values

    kmeans = KMeans(n_clusters=K, random_state=RANDOM_STATE, n_init='auto')
    clusters = kmeans.fit_predict(X)
    df['cluster'] = clusters

    # Order clusters by SAFETY_INDEX mean ascending (lower safety = higher risk)
    cluster_order = (
        df.groupby('cluster')['SAFETY_INDEX']
          .mean()
          .sort_values()  # ascending
    )
    ordered_clusters = list(cluster_order.index)

    # Map cluster id to rank
    rank_map = {cid: rank for rank, cid in enumerate(ordered_clusters)}
    df['cluster_rank'] = df['cluster'].map(rank_map)

    # Map to labels
    label_map = {
        0: 'CRITICAL',
        1: 'HIGH',
        2: 'MEDIUM',
        3: 'LOW'
    }
    df['RISK_LEVEL'] = df['cluster_rank'].map(label_map)

    # Drop helper cluster columns if desired
    enriched = df.drop(columns=['cluster', 'cluster_rank'])
    enriched.to_csv(OUTPUT_FILE, index=False)
    print(f'Enriched file with RISK_LEVEL written: {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
