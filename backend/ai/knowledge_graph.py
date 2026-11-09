import json
import networkx as nx
from typing import Dict, List, Any, Optional

class UniversityKnowledgeGraph:
    """
    Constructs and maintains a NetworkX directed multi-relational graph representing
    researchers, academic schools, themes, publications, laboratories, and institutional resources.
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self.is_built = False

    def build_graph(
        self,
        schools: List[Dict[str, Any]],
        researchers: List[Dict[str, Any]],
        publications: List[Dict[str, Any]],
        themes: List[Dict[str, Any]],
        laboratories: List[Dict[str, Any]],
        resources: List[Dict[str, Any]],
    ):
        """Construct the NetworkX graph from database records."""
        self.graph.clear()

        # 1. Add School Nodes
        for s in schools:
            node_id = f"school_{s['id']}"
            self.graph.add_node(
                node_id,
                entity_id=s['id'],
                type="School",
                name=s['name'],
                code=s.get('code', ''),
                building=s.get('building', ''),
                color="#3b82f6",  # Blue
                size=28
            )

        # 2. Add Theme Nodes
        for t in themes:
            node_id = f"theme_{t['id']}"
            self.graph.add_node(
                node_id,
                entity_id=t['id'],
                type="ResearchTheme",
                name=t['name'],
                category=t.get('category', ''),
                color="#8b5cf6",  # Purple
                size=20
            )

        # 3. Add Laboratory Nodes
        for lab in laboratories:
            node_id = f"lab_{lab['id']}"
            self.graph.add_node(
                node_id,
                entity_id=lab['id'],
                type="Laboratory",
                name=lab['name'],
                room_no=lab.get('room_no', ''),
                color="#ec4899",  # Pink
                size=18
            )
            # Edge: School -> Laboratory
            if lab.get('school_id'):
                self.graph.add_edge(f"school_{lab['school_id']}", node_id, relationship="HOUSES_LAB", label="Houses")

        # 4. Add Resource Nodes (Datasets, Computing Clusters, Facilities)
        for res in resources:
            node_id = f"resource_{res['id']}"
            self.graph.add_node(
                node_id,
                entity_id=res['id'],
                type="InstitutionalResource",
                name=res['name'],
                resource_type=res.get('resource_type', 'Dataset'),
                color="#f59e0b",  # Amber
                size=18
            )
            # Edge: School -> Resource
            if res.get('school_id'):
                self.graph.add_edge(f"school_{res['school_id']}", node_id, relationship="PROVIDES_RESOURCE", label="Provides")

        # 5. Add Publication Nodes
        for p in publications:
            node_id = f"pub_{p['id']}"
            self.graph.add_node(
                node_id,
                entity_id=p['id'],
                type="Publication",
                name=p['title'][:60] + "..." if len(p.get('title', '')) > 60 else p.get('title', ''),
                full_title=p.get('title', ''),
                year=p.get('publication_year', 2024),
                citations=p.get('citation_count', 0),
                color="#10b981",  # Green
                size=16
            )
            # Edge: Publication -> School
            if p.get('school_id'):
                self.graph.add_edge(node_id, f"school_{p['school_id']}", relationship="AFFILIATED_WITH", label="Affiliated")

        # 6. Add Researcher Nodes and Interconnections
        for r in researchers:
            r_node = f"researcher_{r['id']}"
            self.graph.add_node(
                r_node,
                entity_id=r['id'],
                type="Researcher",
                name=r['name'],
                designation=r.get('designation', ''),
                school_name=r.get('school_name', ''),
                h_index=r.get('h_index', 5),
                color="#0284c7",  # Indigo/Deep Sky
                size=24
            )

            # Edge: Researcher -> School (BELONGS_TO)
            if r.get('school_id'):
                self.graph.add_edge(r_node, f"school_{r['school_id']}", relationship="BELONGS_TO", label="Belongs To")

            # Edges: Researcher -> Themes (RESEARCHES)
            theme_ids = r.get('theme_ids', [])
            for tid in theme_ids:
                t_node = f"theme_{tid}"
                if self.graph.has_node(t_node):
                    self.graph.add_edge(r_node, t_node, relationship="RESEARCHES", label="Researches")

            # Edges: Researcher -> Publications (PUBLISHED)
            pub_ids = r.get('publication_ids', [])
            for pid in pub_ids:
                p_node = f"pub_{pid}"
                if self.graph.has_node(p_node):
                    self.graph.add_edge(r_node, p_node, relationship="PUBLISHED", label="Published")

            # Edges: Researcher -> Laboratory (LEADS or USES)
            if r.get('lead_lab_id'):
                lab_node = f"lab_{r['lead_lab_id']}"
                if self.graph.has_node(lab_node):
                    self.graph.add_edge(r_node, lab_node, relationship="LEADS_LAB", label="Directs")

        self.is_built = True

    def get_full_graph_data(self) -> Dict[str, Any]:
        """Export nodes and links for frontend visualizer."""
        nodes = []
        for n, attr in self.graph.nodes(data=True):
            node_dict = dict(attr)
            node_dict["id"] = n
            nodes.append(node_dict)

        links = []
        for u, v, attr in self.graph.edges(data=True):
            links.append({
                "source": u,
                "target": v,
                "relationship": attr.get("relationship", "CONNECTED"),
                "label": attr.get("label", "Connected")
            })

        return {
            "nodes": nodes,
            "links": links,
            "total_nodes": len(nodes),
            "total_links": len(links)
        }

    def find_paths_between_researchers(self, r1_id: int, r2_id: int, max_depth: int = 4) -> List[List[Dict[str, Any]]]:
        """Finds top shortest semantic paths (via themes, publications, labs) between two researchers."""
        node1 = f"researcher_{r1_id}"
        node2 = f"researcher_{r2_id}"

        if not self.graph.has_node(node1) or not self.graph.has_node(node2):
            return []

        undirected = self.graph.to_undirected()
        paths_list = []
        try:
            from itertools import islice
            # Use shortest_simple_paths (Yen's algorithm) to avoid combinatorial explosion
            gen = nx.shortest_simple_paths(undirected, source=node1, target=node2)
            for p in islice(gen, 4):
                if len(p) > max_depth + 1:
                    break
                path_details = []
                for node_id in p:
                    node_data = dict(self.graph.nodes[node_id])
                    node_data["id"] = node_id
                    path_details.append(node_data)
                paths_list.append(path_details)
        except Exception:
            pass

        return paths_list

    def compute_graph_connectivity_score(self, r1_id: int, r2_id: int) -> float:
        """
        Calculates graph proximity and co-occurrence score based on shared themes,
        co-affiliated resources, and graph shortest path distance.
        """
        node1 = f"researcher_{r1_id}"
        node2 = f"researcher_{r2_id}"

        if not self.graph.has_node(node1) or not self.graph.has_node(node2):
            return 0.1

        undirected = self.graph.to_undirected()
        try:
            # Shortest path distance
            length = nx.shortest_path_length(undirected, source=node1, target=node2)
            # Distance 2 (e.g. R1 -> Theme -> R2) is ideal (proximity 1.0)
            # Distance 3 or 4 is moderately connected
            if length == 2:
                proximity = 1.0
            elif length == 3:
                proximity = 0.75
            elif length == 4:
                proximity = 0.50
            else:
                proximity = 0.25
        except nx.NetworkXNoPath:
            proximity = 0.05

        # Shared neighbors (e.g. shared themes, shared labs)
        neighbors_1 = set(undirected.neighbors(node1))
        neighbors_2 = set(undirected.neighbors(node2))
        shared = neighbors_1.intersection(neighbors_2)
        shared_bonus = min(0.3, len(shared) * 0.15)

        total_score = min(1.0, (proximity * 0.7) + shared_bonus)
        return round(float(total_score), 3)

    def get_centrality_metrics(self) -> Dict[str, Any]:
        """Calculates degree centrality and key hub researchers."""
        if not self.is_built or len(self.graph) == 0:
            return {"top_hubs": [], "interdisciplinary_bridges": []}

        deg_centrality = nx.degree_centrality(self.graph)
        
        # Filter for researchers
        researcher_scores = []
        for n, score in deg_centrality.items():
            if n.startswith("researcher_"):
                data = self.graph.nodes[n]
                researcher_scores.append({
                    "id": data.get("entity_id"),
                    "name": data.get("name"),
                    "school": data.get("school_name"),
                    "centrality": round(score, 4)
                })

        researcher_scores.sort(key=lambda x: x["centrality"], reverse=True)
        return {
            "top_hubs": researcher_scores[:8],
            "average_degree": round(sum(dict(self.graph.degree()).values()) / max(1, len(self.graph)), 2)
        }

knowledge_graph_service = UniversityKnowledgeGraph()
