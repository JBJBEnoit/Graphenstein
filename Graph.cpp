#include <iostream>
#include <vector>
#include <list>
#include <sstream>
#include <queue>
#include <stack>
#include <map>
#include <unordered_set>
#include <emscripten/bind.h>

using namespace emscripten;

struct adjNode {
	int id_ = -1; // This will hold an index of 0 to numVertices - 1
	int weight_ = -1;
	constexpr adjNode(int const _id, int const _weight) : id_(_id), weight_(_weight){}
};

struct Edge {
	int start_vertex_, end_vertex_, weight_;
	constexpr Edge(int const _start, int const _end, int const _weight) : start_vertex_(_start), end_vertex_(_end), weight_(_weight){}
};

// Undirected graph capable of storing edge weights
// TODO implement function to set weights to default=1 if only start and end given in initializer edge string
class Graph {
private:
	void parse_edge_str(std::string const edge_str)
	{
		std::istringstream slash_strm(edge_str);
		std::string cur;

		while (getline(slash_strm, cur, '/'))
		{
			std::istringstream comma_strm(cur);
			int start;
			int end;
			int weight;
			char comma;
			comma_strm >> start >> comma >> end >> comma >> weight;
			Edge newEdge(start, end, weight);
			this->edges.push_back(newEdge);
		}
	}

	void preflowInit(int source, std::vector<int>& flow, std::vector<int>& excessFlow)
	{
		for (int i = 0; i < edges.size(); ++i)
		{
			if (edges[i].start_vertex == source)
			{
				flow[i] = edges[i].weight;
				excessFlow[edges[i].end_vertex] += flow[i];
				flow.push_back(-flow[i]);
				edges.push_back(Edge(edges[i].end_vertex, edges[i].start_vertex, 0));
			}
		}
	}

	int excessFlowVertex(int source, int sink, std::vector<int>& excessFlow)
	{
		for (int i = 0; i < numVertices; ++i)
		{
			if (i != source && i != sink && excessFlow[i] > 0)
			{
				return i;
			}
		}

		return -1;
	}

	bool push(int vertex, std::vector<int>& flow, std::vector<int>& height, std::vector<int>& excessFlow)
	{
		for (int i = 0; i < edges.size(); ++i)
		{
			if (edges[i].start_vertex == vertex)
			{
				if (flow[i] == edges[i].weight)
				{
					continue;
				}

				if (height[vertex] > height[edges[i].end_vertex])
				{
					int pushFlow = std::min(edges[i].weight - flow[i], excessFlow[vertex]);
					excessFlow[vertex] -= pushFlow;
					excessFlow[edges[i].end_vertex] += pushFlow;
					flow[i] += pushFlow;
					updateReverseEdgeFlow(i, pushFlow, flow);
					return true;
				}
			}
		}

		return false;
	}

	void updateReverseEdgeFlow(int edge, int pushFlow, std::vector<int>& flow)
	{
		int start = edges[edge].end_vertex;
		int end = edges[edge].start_vertex;

		for (int j = 0; j < edges.size(); ++j)
		{
			if (edges[j].start_vertex == start && edges[j].end_vertex == end)
			{
				flow[j] -= pushFlow;
				return;
			}
		}

		edges.push_back(Edge(start, end, pushFlow));
		flow.push_back(0);
	}

	void relabel(int vertex, std::vector<int>& flow, std::vector<int>& height)
	{
		int minHeight = INT32_MAX;

		for (int i = 0; i < edges.size(); ++i)
		{
			if (edges[i].start_vertex == vertex)
			{
				if (flow[i] == edges[i].weight)
				{
					continue;
				}

				if (height[edges[i].end_vertex] < minHeight)
				{
					minHeight = height[edges[i].end_vertex];
				}

				height[vertex] = minHeight + 1;
			}
		}
	}
	
protected:

	// Lazy Dijkstra's algorithm (for graphs without negative weights, cycles OK)
	std::vector<int> dijkstra_lazy(int const start, std::vector<int>& prev)
	{
		std::vector<int> dist(numVertices, INT32_MAX);
		std::vector<int> prevTmp(numVertices, -1);
		prev = std::move(prevTmp);
		dist[start] = 0;
		std::vector<bool> vis(numVertices);

		typedef std::pair<int, int> myPair;

		// Custom comparator (we want this to be a min-heap sorted by the weights)
		struct pairCmp
		{
			bool operator () (myPair lhs, myPair const rhs)
			{
				return lhs.second > rhs.second;
			}
		};

		std::priority_queue <myPair, std::vector<myPair>, pairCmp> pq;
		myPair startP(start, 0);
		pq.push(startP);

		while (!pq.empty())
		{
			myPair cur = pq.top();
			pq.pop();
			vis[cur.first] = true;
			int minVal = cur.second;

			// If we've already found a shorter path to this node, we can skip processing it
			if (dist[cur.first] < minVal)
			{
				continue;
			}
			for (auto node : adj[cur.first])
			{
				if (vis[node.id])
				{
					continue;
				}

				// Return early with error indicator if negative weight encountered
				if (node.weight < 0)
				{
					std::vector<int>tmp(1, -2);
					return tmp;
				}

				int newDist = cur.second + node.weight;
				if (newDist < dist[node.id])
				{
					dist[node.id] = newDist;
					prev[node.id] = cur.first;
					pq.push(myPair(node.id, newDist));
				}
			}
		}
		return dist;
	}

	// dfs utility for cycle checking
	bool dfs_for_cycle_check(std::vector<bool>& finished, std::unordered_set<int>& visited, int node, int parent)
	{

		if (visited.find(node) != visited.end())
		{
			return true;
		}
		
		visited.insert(node);

		for (auto i : adj[node])
		{
			if (!finished[i.id] && i.id != parent && dfs_for_cycle_check(finished, visited, i.id, node))
			{
				return true;
			}
		}

		finished[node] = true;
		return false;
	}

	virtual void adj_erase(std::vector<std::list<adjNode>>& adjList, unsigned idx, adjNode target) {};

	std::vector<std::list<adjNode>> adj_; //array of adjacency lists
	std::vector<std::string> JSON_data_; // This is used for any data to be tracked by the vertices
	unsigned numVertices_; // number of vertices in graph
	std::vector<Edge> edges_; //vector of all edges (used in Kruskal's algorithm, for example)
	unsigned eulerStart_ = 0;
	
public:

	bool cycleChecked = false;
	bool isAcyclic = false;
	bool isEulerianCycle = true;

	// Constructor
	Graph(std::string const& _edgeStr, unsigned const _numVertices) : numVertices_(_numVertices)
	{
		adj = std::move(std::vector<std::list<adjNode>>(numVertices));
		JSON_data = std::move(std::vector<std::string>(numVertices));
		parse_edge_str(edgeStr);
	}

	unsigned size()
	{
		return numVertices;
	}

	std::vector<int> find_shortest_path(int const start, int const end)
	{
		std::vector<int> prev;
		std::list<int> path;
		std::vector<int> dist = dijkstra_lazy(start, prev);
		
		// Check if negative weight was encountered
		if (dist[0] == -2)
		{
			return dist;
		}

		// Check that path exists, return empty vector if not
		if (dist[end] == INT32_MAX)
		{
			std::vector<int> empty;
			empty.push_back(-1);
			return empty;
		}

		int cur = end;
		path.push_back(cur);
		while (cur != start)
		{
			cur = prev[cur];
			path.push_front(cur);
		}

		std::vector<int> output(path.begin(), path.end());
		return output;
	}

	// Check for cycles
	bool is_acyclic()
	{
		if (cycleChecked)
		{
			return isAcyclic;
		}

		std::vector<bool> finished(numVertices);
		cycleChecked = true;
		for (int i = 0; i < numVertices; ++i)
		{
			std::unordered_set<int> visited;
			if (!finished[i] && dfs_for_cycle_check(finished, visited, i, -1))
			{
				return (isAcyclic = false);
			}
		}

		return (isAcyclic = true);
	}

	std::vector<std::vector<int>> find_cycles()
	{
		
		std::vector<std::vector<int>> output;
		for (int i = 0; i < numVertices; ++i)
		{
			std::vector<bool> vis(numVertices);
			std::unordered_set<int> set;
			if (!dfs_for_cycle_check(vis, set, i, -1))
			{
				std::vector<int> tmp(set.begin(), set.end());
				output.push_back(tmp);
			}
		}

		return output;
	}

	std::vector<int> hierholzer()
	{
		// Return empty vector if there is no possible Eulerian circuit
		if (!isEulerianCycle)
		{
			std::vector<int> tmp;
			return tmp;
		}

		// Make working copy of adjancency list, since we will have to remove edges
		std::vector<std::list<adjNode>> tmpAdj(adj);

		std::stack<unsigned> curPath;
		std::stack<unsigned> ePath;
		curPath.push(eulerStart);

		while (!curPath.empty())
		{
			unsigned curVertex = curPath.top();

			if (tmpAdj[curVertex].size() == 0)
			{
				ePath.push(curVertex);
				curPath.pop();
			}
			else
			{
				curPath.push(tmpAdj[curVertex].begin()->id);
				adj_erase(tmpAdj, curVertex, *tmpAdj[curVertex].begin());

			}
		}

		std::vector<int> output;
		while (!ePath.empty())
		{
			output.push_back(ePath.top());
			ePath.pop();
		}

		return output;
	}

	int push_relabel_max_flow(int source, int sink)
	{
		std::vector<int> flow(edges.size());
		std::vector<int> excessFlow(numVertices);
		std::vector<int> height(numVertices);
		height[source] = numVertices;
		preflowInit(source, flow, excessFlow);

		while (excessFlowVertex(source, sink, excessFlow) != -1)
		{
			int vertex = excessFlowVertex(source, sink, excessFlow);
			if (!push(vertex, flow, height, excessFlow))
			{
				relabel(vertex, flow, height);
			}
		}

		return excessFlow[sink];
	}
};

class Digraph: public Graph {
protected:
	void buildAdjList()
	{
		std::vector<int> inEdges(numVertices);
		std::vector<int> outEdges(numVertices);

		for (const auto& e : this->edges)
		{
			int start = e.start_vertex;
			int end = e.end_vertex;
			int weight = e.weight;
			adjNode newNode(end, weight);
			adj[start].push_front(newNode);
			++inEdges[end];
			++outEdges[start];
		}

		bool moreIn = false;
		bool moreOut = false;

		// Check for Euler cycle/path
		for (size_t i = 0; i < numVertices; ++i)
		{
			if (inEdges[i] - outEdges[i] == 1 && !moreIn)
			{
				moreIn = true;
			}
			else if (outEdges[i] - inEdges[i] == 1 && !moreOut)
			{
				moreOut = true;
				eulerStart = i;
			}
			else if (inEdges[i] != outEdges[i])
			{
				isEulerianCycle = false;
				break;
			}
		}

		if (!(moreIn && moreOut))
		{
			eulerStart = 0;
		}
		
		if ((!moreIn && moreOut) || (moreIn && !moreOut))
		{
			isEulerianCycle = false;
		}

	}

	void dfs_for_topsort(std::vector<bool>& visited, size_t const node, std::vector<int>& ordering, size_t& orderIdx) // IMPORTANT that ordIdx is passed by reference
	{
		if (visited[node])
		{
			return;
		}

		visited[node] = true;

		for (auto n : adj[node])
		{
			dfs_for_topsort(visited, n.id, ordering, orderIdx);
		}

		ordering[orderIdx--] = (int)node;
	}

	void tarjansUtil(std::vector<int>& discovered, std::vector<int>& low, std::vector<bool>& onStack, std::vector<int>& res, std::vector<std::vector<int>>& output, std::stack<int>& st, int node, int& time)
	{
		++time;
		discovered[node] = time;
		low[node] = time;
		st.push(node);
		onStack[node] = true;

		for (auto i : adj[node])
		{
			if (discovered[i.id] == -1)
			{
				tarjansUtil(discovered, low, onStack, res, output, st, i.id, time);
				low[node] = std::min(low[node], low[i.id]);
			}
			else if (onStack[i.id])
			{
				low[node] = std::min(low[node], discovered[i.id]);
			}
		}

		if (low[node] == discovered[node])
		{
			while (st.top() != node)
			{
				int cur = st.top();
				res.push_back(cur);
				onStack[cur] = false;
				st.pop();
			}

			res.push_back(st.top());
			output.push_back(res);
			res.clear();
			onStack[st.top()] = false;
			st.pop();
		}
	}

	void adj_erase (std::vector<std::list<adjNode>>& adjList, unsigned idx, adjNode target) override
	{
		auto it = adjList[idx].begin();
		for (; it != adjList[idx].end(); ++it)
		{
			if (it->id == target.id && it->weight == target.weight)
			{
				adjList[idx].erase(it);
				break; 
			}
		}
	}

public:
	// Constructor
	Digraph(std::string const& edgeStr, unsigned const numVertices): Graph(edgeStr, numVertices)
	{
		buildAdjList();
	}

	// Topological sort for DAG
	std::vector<int> topsort()
	{
		// Can't run this algorithm on graph with cycles, so return empty vector if this is the case
		if (!is_acyclic())
		{
			std::vector<int> tmp;
			return tmp;
		}

		std::vector<int> ordering(numVertices);
		std::vector<bool> vis(numVertices);
		size_t ordIdx = numVertices - 1;

		for (size_t i = 0; i < numVertices; ++i)
		{
			if (!vis[i])
			{
				dfs_for_topsort(vis, i, ordering, ordIdx);
			}
		}

		return ordering;
	}

	// Shortest distance to all nodes from single source in a DAG, using topological sort
	std::vector<int> dagSSSPByTopsort(int const start)
	{
		std::vector<int> tpsort = topsort();
		std::vector<int> distances(numVertices, INT32_MAX); //using intmax for infinity
		distances[start] = 0; //distance to itself

		for (size_t i = 0; i < distances.size(); ++i)
		{
			size_t nodeIdx = tpsort[i];
			if (distances[nodeIdx] != INT32_MAX)
			{
				int weight = distances[nodeIdx];

				for (auto node : adj[nodeIdx])
				{
					int curWeight = weight + node.weight;
					distances[node.id] = distances[node.id] < curWeight ? distances[node.id] : curWeight;
				}
			}
		}

		return distances;
	}

	std::vector<std::vector<int>> tarjans_strongly_connected_components()
	{
		std::vector<int> discovered(numVertices, -1);
		std::vector<int> low(numVertices, -1);
		std::vector<bool> onStack(numVertices);
		std::stack<int> st;
		std::vector<std::vector<int>> output;
		int time = 0;


		for (int i = 0; i < numVertices; ++i)
		{			
			if (discovered[i] == -1)
			{
				std::vector<int> res;
				tarjansUtil(discovered, low, onStack, res, output, st, i, time);
			}
		}

		return output;
	}

	// Hierholzer's algorithm for finding Eulerian Cycle / Path
	// This implementation needs to be included in both Undirected_Graph and Digraph since the adj_erase() methods are different
	// and the bind.h library will not allow Graph to be an abstract class (uses non-virtual destructor)
	std::vector<int> hierholzer()
	{
		// Return empty vector if there is no possible Eulerian circuit
		if (!isEulerianCycle)
		{
			std::vector<int> tmp;
			return tmp;
		}

		// Make working copy of adjancency list, since we will have to remove edges
		std::vector<std::list<adjNode>> tmpAdj(adj);

	

		while (!curPath.empty(	std::stack<unsigned> curPath;
		std::stack<unsigned> ePath;
		curPath.push(eulerStart);))
		{
			unsigned curVertex = curPath.top();

			if (tmpAdj[curVertex].size() == 0)
			{
				ePath.push(curVertex);
				curPath.pop();
			}
			else
			{
				curPath.push(tmpAdj[curVertex].begin()->id);
				adj_erase(tmpAdj, curVertex, *tmpAdj[curVertex].begin());

			}
		}

		std::vector<int> output;
		while (!ePath.empty())
		{
			output.push_back(ePath.top());
			ePath.pop();
		}

		return output;

	}

	std::vector<int> bellman_ford(int source)
	{
		std::vector<int> dist(numVertices, INT32_MAX);
		std::vector<int> prev(numVertices, -1);
		dist[source] = 0;

		for (int i = 1; i < numVertices; ++i)
		{
			for (auto e : edges)
			{
				if (dist[e.start_vertex] != INT32_MAX && dist[e.start_vertex] + e.weight < dist[e.end_vertex])
				{
					dist[e.end_vertex] = dist[e.start_vertex] + e.weight;
					prev[e.end_vertex] = e.start_vertex;
				}
			}
		}

		// Check for negative cycle
		for (auto e : edges)
		{
			if (dist[e.start_vertex] != INT32_MAX && dist[e.start_vertex] + e.weight < dist[e.end_vertex])
			{
				std::vector<int> tmp(1, -2);
				return tmp;
			}
		}

		return prev;
	}
};

class Undirected_Graph : public Graph
{
protected:
	void adj_erase (std::vector<std::list<adjNode>>& adjList, unsigned idx, adjNode target) override
	{
		auto it = adjList[idx].begin();
		for (; it != adjList[idx].end(); it++)
		{
			if (it->id == target.id && it->weight == target.weight)
			{
				adjList[idx].erase(it);
				break;
			}
		}

		// Need to erase reciprocal edge as well

		it = adjList[target.id].begin();
		for (; it != adjList[target.id].end(); it++)
		{
			if (it->id == idx && it->weight == target.weight)
			{
				adjList[target.id].erase(it);
				break;
			}
		}
	}

	void buildAdjList()
	{
		std::vector<unsigned> degree(numVertices, 0);

		for (const auto& e : this->edges)
		{
			int start = e.start_vertex;
			int end = e.end_vertex;
			int weight = e.weight;
			adjNode newNode(end, weight);
			adj[start].push_front(newNode);
			adjNode newNode2(start, weight);
			adj[end].push_front(newNode2);
			++degree[start];
			++degree[end];
		}

		// Test for Eulerian Cycle
		// (Number of incoming edges for a vertex must match outgoing edges, and for undirected graph, degree of node (total edges) must be even
		// Or else there must be exactly two odd degree vertices (one of them being used as the start of the algorithm)
		unsigned oddCount = 0;
		for (unsigned i = 0; i < numVertices; ++i)
		{
			if (degree[i] % 2 != 0)
			{
				++oddCount;
				eulerStart = i;
			}
		}

		isEulerianCycle = oddCount == 0 || oddCount == 2;
	}

	void dfs_components(std::vector<bool>& visited, int const start, std::map<int, std::vector<int>>& components, int count)
	{
		std::stack<int> stck;
		stck.push(start);

		while (!stck.empty())
		{
			int cur = stck.top();
			stck.pop();
			if (!visited[cur])
			{
				for (adjNode a : adj[cur])
				{
					stck.push(a.id);
				}

				visited[cur] = true;
				components[count].push_back(cur);
			}
		}
	}

	// used by kruskal algorithm
	// finds the vertex in a component that does not have a parent
	int find_set(std::vector<int>& parent, int i)
	{
		if (parent[i] == i)
		{
			return i;
		}
		else
		{
			return find_set(parent, parent[i]);
		}
	}

	// used by kruskal
	// unifies one set under another by making the set representative of one the parent of the set representative of the other
	void union_set(std::vector<int>& parent, int u, int  v)
	{
		parent[u] = parent[v];
	}

public:
	Undirected_Graph(std::string const& edgeStr, unsigned const numVertices): Graph(edgeStr, numVertices)
	{
		buildAdjList();
	}

	std::map<int, std::vector<int>> connected_components()
	{
		std::map<int, std::vector<int>> components;
		std::vector<bool> visited(numVertices);
		int count = 0;

		for (unsigned i = 0; i < numVertices; ++i)
		{
			if (!visited[i])
			{
				dfs_components(visited, i, components, count);
				++count;

			}
		}

		return components;
	}

	std::vector<std::vector<int>> kruskal()
	{
		std::vector<int> parent(numVertices);
		std::vector<std::vector<int>> output;
		int i, uRep, vRep;
		for (int i = 0; i < numVertices; ++i)
		{
			parent[i] = i;
		}
		sort(edges.begin(), edges.end(), [](Edge left, Edge right)->bool { return left.weight < right.weight; });

		for (auto const e : edges)
		{
			uRep = find_set(parent, e.start_vertex);
			vRep = find_set(parent, e.end_vertex);
			if (uRep != vRep)
			{
				std::vector<int> tmp;
				tmp.push_back(e.start_vertex);
				tmp.push_back(e.end_vertex);
				tmp.push_back(e.weight);
				output.push_back(tmp);
				union_set(parent, uRep, vRep);
			}
		}

		return output;
	}

	std::vector<std::vector<int>> prim()
	{
		std::vector<std::vector<int>> output;
		std::vector<bool> selected(numVertices);
		int edgesInTree = 0;
		

		selected[0] = true;
		while (edgesInTree < numVertices - 1)
		{
			int min = INT_MAX;
			int start = 0;
			int end = 0;

			for (int i = 0; i < numVertices; ++i)
			{
				if (selected[i])
				{
					for (auto j : adj[i])
					{
						if (!selected[j.id] && min > j.weight)
						{
							min = j.weight;
							start = i;
							end = j.id;
						}
					}
				}
			}

			std::vector<int> tmp;
			tmp.push_back(start);
			tmp.push_back(end);
			tmp.push_back(min);
			selected[end] = true;
			++edgesInTree;
			output.push_back(tmp);
		}

		return output;
	}

	// Hierholzer's algorithm for finding Eulerian Cycle / Path
	// This implementation needs to be included in both Undirected_Graph and Digraph since the adj_erase() methods are different
	// and the bind.h library will not allow Graph to be an abstract class (uses non-virtual destructor)
	std::vector<int> hierholzer()
	{
		// Return empty vector if there is no possible Eulerian circuit
		if (!isEulerianCycle)
		{
			std::vector<int> tmp;
			return tmp;
		}

		// Make working copy of adjancency list, since we will have to remove edges
		std::vector<std::list<adjNode>> tmpAdj(adj);

		std::stack<unsigned> curPath;
		std::stack<unsigned> ePath;
		curPath.push(eulerStart);

		while (!curPath.empty())
		{
			unsigned curVertex = curPath.top();

			if (tmpAdj[curVertex].size() == 0)
			{
				ePath.push(curVertex);
				curPath.pop();
			}
			else
			{
				curPath.push(tmpAdj[curVertex].begin()->id);
				adj_erase(tmpAdj, curVertex, *tmpAdj[curVertex].begin());

			}
		}

		std::vector<int> output;
		while (!ePath.empty())
		{
			output.push_back(ePath.top());
			ePath.pop();
		}

		return output;
	}
};


EMSCRIPTEN_BINDINGS(my_graph)
{
	register_vector<int>("IntVector");
	register_vector<std::vector<int>>("IntVectorVector");
	register_map<int, std::vector<int>>("IntIntVectorMap");
	constant("INT_MAX", INT32_MAX);

	class_<Graph>("Graph")
		.constructor<std::string, unsigned>()
		.function("size", &Graph::size)
		.function("find_shortest_path", &Graph::find_shortest_path)
		.function("isAcyclic", &Graph::is_acyclic)
		.function("find_cycles", &Graph::find_cycles)
		.function("hierholzer", &Graph::hierholzer)
		.function("push_relabel_max_flow", &Graph::push_relabel_max_flow)
		;

	class_<Digraph, base<Graph>>("Digraph")
		.constructor<std::string, unsigned>()
		.function("size", &Graph::size)
		.function("topsort", &Digraph::topsort)
		.function("dagSSSPLen", &Digraph::dagSSSPByTopsort)
		.function("find_shortest_path", &Graph::find_shortest_path)
		.function("is_acyclic", &Graph::is_acyclic)
		.function("find_cycles", &Graph::find_cycles)
		.function("tarjans_strongly_connected_components", &Digraph::tarjans_strongly_connected_components)
		.function("bellman_ford", &Digraph::bellman_ford)
		.function("hierholzer", &Graph::hierholzer)
		.function("push_relabel_max_flow", &Graph::push_relabel_max_flow)
		;

	class_<Undirected_Graph, base<Graph>>("UndirectedGraph")
		.constructor<std::string, unsigned>()
		.function("size", &Graph::size)
		.function("find_shortest_path", &Graph::find_shortest_path)
		.function("connected_components", &Undirected_Graph::connected_components)
		.function("is_acyclic", &Graph::is_acyclic)
		.function("find_cycles", &Graph::find_cycles)
		.function("kruskal", &Undirected_Graph::kruskal)
		.function("prim", &Undirected_Graph::prim)
		.function("hierholzer", &Graph::hierholzer)
		.function("push_relabel_max_flow", &Graph::push_relabel_max_flow)
		;
}